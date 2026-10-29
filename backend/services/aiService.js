/**
 * aiService.js — AI Decision-Support Service (Gemini)
 *
 * IMPORTANT CONSTRAINTS:
 *  - This service is READ-ONLY. It NEVER modifies any database record.
 *  - It NEVER auto-approves, auto-rejects, or auto-transfers any allocation.
 *  - It ONLY analyzes the candidates already produced by the rule-based allocationEngine.js.
 *  - The final decision ALWAYS remains with the authorized Education Department Officer.
 *  - The API key MUST be set in the environment variable AI_API_KEY (backend/.env).
 *    It is NEVER exposed to the frontend.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Allocation from '../models/Allocation.js';
import Requirement from '../models/Requirement.js';
import Resource from '../models/Resource.js';

/**
 * Analyzes allocation candidates for a given requirement using Gemini AI.
 * Returns a ranked list of candidates with scores and reasons.
 *
 * @param {string} requirementId  - MongoDB _id of the Requirement document
 * @returns {Object}              - Structured AI analysis result
 */
export const analyzeAllocationCandidates = async (requirementId) => {
  // ── 1. Validate API key ─────────────────────────────────────────────────────
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return {
      success: false,
      error: 'AI_API_KEY is not configured. Please set it in backend/.env to enable AI analysis.',
      errorType: 'NO_API_KEY',
    };
  }

  // ── 2. Fetch requirement data ───────────────────────────────────────────────
  const requirement = await Requirement.findById(requirementId).populate('schoolId');
  if (!requirement) {
    return { success: false, error: 'Requirement not found.', errorType: 'NOT_FOUND' };
  }

  // ── 3. Fetch rule-engine allocation candidates for this requirement ─────────
  const candidates = await Allocation.find({
    requirementId,
    status: { $in: ['Recommended', 'Pending'] },
  }).populate('donorSchoolId').populate('recipientSchoolId');

  if (!candidates || candidates.length === 0) {
    return {
      success: false,
      error: 'No allocation candidates found for this requirement. Run the allocation scan first.',
      errorType: 'NO_CANDIDATES',
    };
  }

  // ── 4. Enrich each candidate with donor resource details ────────────────────
  const enrichedCandidates = await Promise.all(
    candidates.map(async (alloc, idx) => {
      const donorResource = await Resource.findOne({
        schoolId: alloc.donorSchoolId?._id,
        category: requirement.category,
      });
      return {
        candidateIndex: idx + 1,
        allocationId: alloc._id.toString(),
        donorSchool: alloc.donorSchoolId?.schoolName || 'Unknown Donor',
        donorSchoolCode: alloc.donorSchoolId?.schoolCode || '',
        donorDistrict: alloc.donorSchoolId?.district || '',
        donorStudentCount: alloc.donorSchoolId?.studentCount || 0,
        recipientSchool: alloc.recipientSchoolId?.schoolName || requirement.schoolId?.schoolName || 'Unknown Recipient',
        recipientSchoolCode: alloc.recipientSchoolId?.schoolCode || requirement.schoolId?.schoolCode || '',
        resourceName: alloc.resourceName,
        category: alloc.category,
        availableAtDonor: alloc.availableQuantityAtDonor,
        recommendedQty: alloc.recommendedQuantity,
        shortageQty: requirement.shortageQuantity,
        resourceCondition: alloc.donorResourceCondition,
        distanceKm: alloc.distanceKm,
        estimatedTransportCost: alloc.estimatedTransportCost,
        estimatedRepairCost: alloc.estimatedRepairCost,
        estimatedProcurementCost: alloc.estimatedProcurementCost,
        donorLifecycleStatus: donorResource?.lifecycleStatus || 'Unknown',
        donorMaintenanceStatus: donorResource?.maintenanceStatus || 'Unknown',
        donorGoodConditionCount: donorResource?.goodConditionCount || alloc.recommendedQuantity,
        donorNeedsRepairCount: donorResource?.needsRepairCount || 0,
        donorPurchaseYear: donorResource?.purchaseYear || null,
        donorEstimatedUnitValue: donorResource?.estimatedUnitValue || null,
      };
    })
  );

  // ── 5. Build the Gemini prompt ─────────────────────────────────────────────
  const requirementSummary = {
    resourceName: requirement.resourceName,
    category: requirement.category,
    requiredQuantity: requirement.requiredQuantity,
    availableQuantity: requirement.availableQuantity,
    shortageQuantity: requirement.shortageQuantity,
    urgency: requirement.urgency,
    reason: requirement.reason,
    recipientSchool: requirement.schoolId?.schoolName,
    recipientSchoolCode: requirement.schoolId?.schoolCode,
    recipientDistrict: requirement.schoolId?.district,
    recipientStudentCount: requirement.schoolId?.studentCount,
  };

  const prompt = `You are an AI assistant for the Resource Bridge system — an Education Department tool that helps allocate surplus school resources to schools with shortages.

IMPORTANT:
- You are ONLY providing a ranked analysis to help the officer make an informed decision.
- You must NOT suggest any automatic transfer or approval.
- You must NOT invent data. Use ONLY the data provided below.
- Label your scores clearly as "AI Recommendation Score" (a ranking score, NOT a probability or certainty).

RECIPIENT SCHOOL REQUIREMENT:
${JSON.stringify(requirementSummary, null, 2)}

DONOR CANDIDATES (from rule-based engine):
${JSON.stringify(enrichedCandidates, null, 2)}

TASK:
Rank the ${enrichedCandidates.length} donor candidate(s) from best to least suitable for fulfilling this requirement.

For each candidate, consider:
1. Whether available quantity meets the shortage
2. Resource condition and lifecycle status
3. Distance and estimated transport cost
4. Whether repair count is low (prefer resources in good condition)
5. Age of resources (purchase year, if available)
6. Cost comparison: transport vs repair vs procurement

Return ONLY a valid JSON object (no markdown, no extra text) in this exact structure:
{
  "rankedCandidates": [
    {
      "rank": 1,
      "allocationId": "<id from input>",
      "donorSchool": "<name>",
      "recipientSchool": "<name>",
      "resourceName": "<name>",
      "score": <number 0-100>,
      "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
      "warnings": ["<warning if any>"]
    }
  ],
  "topRecommendationSummary": "<one clear sentence explaining the top pick>",
  "disclaimer": "This is an AI Recommendation Score used for ranking purposes only. It is not a guaranteed probability or certainty. The final allocation decision must be made by the authorized Education Department Officer."
}`;

  // ── 6. Call Gemini API ─────────────────────────────────────────────────────
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps output in ```json ... ```
    const jsonText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[AI Service] JSON parse error. Raw response:', rawText);
      return {
        success: false,
        error: 'AI returned an unexpected response format. Please try again.',
        errorType: 'PARSE_ERROR',
        rawResponse: rawText.slice(0, 500),
      };
    }

    // Attach candidate count and requirement context
    return {
      success: true,
      requirementSummary,
      candidateCount: enrichedCandidates.length,
      analysis: parsed,
    };
  } catch (apiErr) {
    console.error('[AI Service] Gemini API error:', apiErr.message);
    const isAuthError = apiErr.message?.includes('API_KEY') || apiErr.message?.includes('401') || apiErr.message?.includes('403');
    return {
      success: false,
      error: isAuthError
        ? 'Invalid or expired AI_API_KEY. Please check backend/.env and set a valid Gemini API key.'
        : `AI analysis failed: ${apiErr.message}`,
      errorType: isAuthError ? 'AUTH_ERROR' : 'API_ERROR',
    };
  }
};
