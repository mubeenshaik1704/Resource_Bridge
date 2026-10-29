import express from 'express';
import School from '../models/School.js';
import Resource from '../models/Resource.js';
import Requirement from '../models/Requirement.js';
import Allocation from '../models/Allocation.js';
import OfficerDecision from '../models/OfficerDecision.js';
import { seedDatabase } from '../seed/seedData.js';
import { generatePotentialAllocations } from '../services/allocationEngine.js';
import { analyzeAllocationCandidates } from '../services/aiService.js';

const router = express.Router();

// Trigger Database Seeding
router.post('/seed', async (req, res) => {
  try {
    const result = await seedDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all Schools
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.find().sort({ schoolCode: 1 });
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /schools/:id - Update School Profile (Students, Classrooms, Principal, etc.)
router.put('/schools/:id', async (req, res) => {
  try {
    const { studentCount, classroomCount, principalName, contactNumber, address } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      {
        ...(studentCount !== undefined && { studentCount: Number(studentCount) }),
        ...(classroomCount !== undefined && { classroomCount: Number(classroomCount) }),
        ...(principalName && { principalName: principalName.trim() }),
        ...(contactNumber && { contactNumber: contactNumber.trim() }),
        ...(address && { address: address.trim() })
      },
      { new: true }
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all Resources (with optional filters)
router.get('/resources', async (req, res) => {
  try {
    const { schoolId, category, condition } = req.query;
    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;

    const resources = await Resource.find(filter)
      .populate('schoolId', 'schoolName schoolCode district')
      .sort({ updatedAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /resources - Add a new Resource
router.post('/resources', async (req, res) => {
  try {
    const {
      schoolId,
      resourceName,
      category,
      totalQuantity,
      inUseQuantity,
      unusedQuantity,
      condition,
      goodConditionCount,
      needsRepairCount,
      purchaseYear,
      maintenanceStatus,
      schoolLocation,
      estimatedUnitValue,
      estimatedRepairCostPerUnit,
      lifecycleStatus
    } = req.body;

    if (!schoolId || !resourceName || totalQuantity === undefined) {
      return res.status(400).json({ error: 'School, Resource Name, and Total Quantity are required' });
    }

    const total = Number(totalQuantity);
    const inUse = inUseQuantity !== undefined ? Number(inUseQuantity) : total;
    const unused = unusedQuantity !== undefined ? Number(unusedQuantity) : Math.max(0, total - inUse);

    const resource = await Resource.create({
      schoolId,
      resourceName: resourceName.trim(),
      category: category || 'Other',
      totalQuantity: total,
      inUseQuantity: inUse,
      unusedQuantity: unused,
      condition: condition || 'In Use',
      goodConditionCount: goodConditionCount !== undefined ? Number(goodConditionCount) : total,
      needsRepairCount: needsRepairCount !== undefined ? Number(needsRepairCount) : 0,
      purchaseYear: purchaseYear ? Number(purchaseYear) : new Date().getFullYear(),
      maintenanceStatus: maintenanceStatus ? maintenanceStatus.trim() : 'Operational',
      schoolLocation: schoolLocation ? schoolLocation.trim() : 'Main Building',
      estimatedUnitValue: estimatedUnitValue ? Number(estimatedUnitValue) : 15000,
      estimatedRepairCostPerUnit: estimatedRepairCostPerUnit ? Number(estimatedRepairCostPerUnit) : 1500,
      lifecycleStatus: lifecycleStatus || 'In Use'
    });

    const populated = await resource.populate('schoolId', 'schoolName schoolCode district');
    res.status(201).json(populated);
  } catch (error) {
    console.error('[Add Resource Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /resources/:id - Update Resource
router.put('/resources/:id', async (req, res) => {
  try {
    const {
      resourceName,
      category,
      totalQuantity,
      inUseQuantity,
      unusedQuantity,
      condition,
      goodConditionCount,
      needsRepairCount,
      purchaseYear,
      maintenanceStatus,
      schoolLocation,
      estimatedUnitValue,
      estimatedRepairCostPerUnit,
      lifecycleStatus
    } = req.body;

    const updateFields = {
      ...(resourceName && { resourceName: resourceName.trim() }),
      ...(category && { category }),
      ...(totalQuantity !== undefined && { totalQuantity: Number(totalQuantity) }),
      ...(inUseQuantity !== undefined && { inUseQuantity: Number(inUseQuantity) }),
      ...(unusedQuantity !== undefined && { unusedQuantity: Number(unusedQuantity) }),
      ...(condition && { condition }),
      ...(goodConditionCount !== undefined && { goodConditionCount: Number(goodConditionCount) }),
      ...(needsRepairCount !== undefined && { needsRepairCount: Number(needsRepairCount) }),
      ...(purchaseYear && { purchaseYear: Number(purchaseYear) }),
      ...(maintenanceStatus && { maintenanceStatus: maintenanceStatus.trim() }),
      ...(schoolLocation && { schoolLocation: schoolLocation.trim() }),
      ...(estimatedUnitValue !== undefined && { estimatedUnitValue: Number(estimatedUnitValue) }),
      ...(estimatedRepairCostPerUnit !== undefined && { estimatedRepairCostPerUnit: Number(estimatedRepairCostPerUnit) }),
      ...(lifecycleStatus && { lifecycleStatus }),
      updatedAt: new Date()
    };

    // If total & inUse provided but unused not specified, calculate
    if (updateFields.totalQuantity !== undefined && updateFields.inUseQuantity !== undefined) {
      if (updateFields.unusedQuantity === undefined) {
        updateFields.unusedQuantity = Math.max(0, updateFields.totalQuantity - updateFields.inUseQuantity);
      }
    }

    const updated = await Resource.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('schoolId', 'schoolName schoolCode district');

    if (!updated) return res.status(404).json({ error: 'Resource not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /resources/:id - Delete Resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const deleted = await Resource.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Resource not found' });
    res.json({ message: 'Resource deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /resources/:id/lifecycle - Fast Lifecycle State Transition
// Lifecycle: Available → In Use → Underutilized → Needs Repair → Repaired
router.patch('/resources/:id/lifecycle', async (req, res) => {
  try {
    const { lifecycleStatus, condition, maintenanceStatus } = req.body;
    const update = { updatedAt: new Date() };

    if (lifecycleStatus) update.lifecycleStatus = lifecycleStatus;
    if (condition) update.condition = condition;
    if (maintenanceStatus) update.maintenanceStatus = maintenanceStatus;

    // Automatic synchronizations based on lifecycle transitions
    if (lifecycleStatus === 'In Use') {
      update.condition = 'In Use';
    } else if (lifecycleStatus === 'Underutilized') {
      update.condition = 'Underutilized';
    } else if (lifecycleStatus === 'Needs Repair') {
      update.condition = 'Needs Repair';
    } else if (lifecycleStatus === 'Repaired') {
      update.lifecycleStatus = 'In Use';
      update.condition = 'In Use';
      update.maintenanceStatus = 'Recently Serviced / Repaired';
    } else if (lifecycleStatus === 'Available') {
      update.condition = 'Unused';
    }

    const updated = await Resource.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('schoolId', 'schoolName schoolCode district');

    if (!updated) return res.status(404).json({ error: 'Resource not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all Requirements (Shortages) with optional schoolId filter
router.get('/requirements', async (req, res) => {
  try {
    const { schoolId, status } = req.query;
    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (status) filter.status = status;

    const requirements = await Requirement.find(filter)
      .populate('schoolId', 'schoolName schoolCode district')
      .sort({ createdAt: -1 });

    res.json(requirements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /requirements - Submit Resource Requirement & Calculate Shortage (Non-AI Business Logic)
router.post('/requirements', async (req, res) => {
  try {
    const { schoolId, resourceName, category, requiredQuantity, urgency, reason } = req.body;

    if (!schoolId || !resourceName || !requiredQuantity) {
      return res.status(400).json({ error: 'School, Resource Name, and Required Quantity are required' });
    }

    const reqQty = Number(requiredQuantity);
    if (reqQty <= 0) {
      return res.status(400).json({ error: 'Required quantity must be greater than zero' });
    }

    // Normal Business Logic Shortage Detection (Strictly NO AI):
    // 1. Look for existing resources at this school with matching category or name
    const existingResources = await Resource.find({
      schoolId,
      $or: [
        { category: category },
        { resourceName: { $regex: new RegExp(resourceName.trim(), 'i') } }
      ]
    });

    // 2. Available operational units: total - damaged (or inUse + unused)
    let availableQuantity = 0;
    existingResources.forEach(r => {
      availableQuantity += (r.inUseQuantity || 0) + (r.unusedQuantity || 0);
    });

    // 3. Shortage = max(0, required - available)
    const shortageQuantity = Math.max(0, reqQty - availableQuantity);

    // 4. Save requirement request
    const requirement = await Requirement.create({
      schoolId,
      resourceName: resourceName.trim(),
      category: category || 'Other',
      requiredQuantity: reqQty,
      availableQuantity,
      shortageQuantity,
      urgency: urgency || 'Medium',
      reason: reason ? reason.trim() : 'Academic / classroom requirement',
      status: 'Submitted'
    });

    const populated = await requirement.populate('schoolId', 'schoolName schoolCode district');

    // Automatically trigger non-AI allocation scanner in background
    generatePotentialAllocations().catch(err => console.error('[Auto Allocation Scan Error]', err.message));

    res.status(201).json(populated);
  } catch (error) {
    console.error('[Submit Requirement Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /requirements/:id - Withdraw / Delete Requirement
router.delete('/requirements/:id', async (req, res) => {
  try {
    const deleted = await Requirement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Requirement not found' });
    res.json({ message: 'Requirement withdrawn successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /allocations/scan - Trigger Non-AI Potential Allocation Recommendation Engine
router.post('/allocations/scan', async (req, res) => {
  try {
    const allocations = await generatePotentialAllocations();
    res.json({
      message: 'Potential allocation scan completed',
      recommendationsCount: allocations.length,
      recommendations: allocations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all Potential Allocations
router.get('/allocations', async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('donorSchoolId', 'schoolName schoolCode district latitude longitude')
      .populate('recipientSchoolId', 'schoolName schoolCode district latitude longitude')
      .populate('requirementId')
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Decision History
router.get('/decisions', async (req, res) => {
  try {
    const decisions = await OfficerDecision.find()
      .populate('recipientSchoolId', 'schoolName schoolCode district')
      .populate('requirementId')
      .sort({ decidedAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /decisions - Record Education Department Officer Decision
router.post('/decisions', async (req, res) => {
  try {
    const {
      officerName,
      requirementId,
      allocationId,
      decisionType,
      commentReason,
      estimatedCost
    } = req.body;

    if (!officerName || !requirementId || !decisionType || !commentReason) {
      return res.status(400).json({
        error: 'Officer Name, Requirement, Decision Type, and Reason/Comment are mandatory'
      });
    }

    // Find the requirement
    const requirement = await Requirement.findById(requirementId).populate('schoolId');
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement request not found' });
    }

    // Determine target status
    const isApproval = decisionType.toLowerCase().includes('approved');
    const newReqStatus = isApproval ? 'Approved' : 'Rejected';
    requirement.status = newReqStatus;
    await requirement.save();

    // If an allocation was involved, update its status too
    if (allocationId) {
      const allocation = await Allocation.findById(allocationId);
      if (allocation) {
        allocation.status = isApproval ? 'Approved' : 'Rejected';
        allocation.officerRemarks = commentReason.trim();
        await allocation.save();
      }
    }

    // Create Audit Log Entry
    const decision = await OfficerDecision.create({
      officerName: officerName.trim(),
      requirementId: requirement._id,
      allocationId: allocationId || null,
      recipientSchoolId: requirement.schoolId?._id || requirement.schoolId,
      resourceName: requirement.resourceName,
      decisionType: decisionType.trim(),
      commentReason: commentReason.trim(),
      estimatedCost: Number(estimatedCost || 0),
      decidedAt: new Date()
    });

    const populated = await decision.populate('recipientSchoolId', 'schoolName schoolCode district');
    res.status(201).json(populated);
  } catch (error) {
    console.error('[Officer Decision Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// GET Dashboard Statistics
router.get('/stats', async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    
    // Aggregation on Resources
    const resources = await Resource.find();
    let totalResourcesCount = 0;
    let unusedResourcesCount = 0;
    let underutilizedResourcesCount = 0;
    let needingRepairCount = 0;

    resources.forEach((r) => {
      totalResourcesCount += r.totalQuantity || 0;
      unusedResourcesCount += r.unusedQuantity || 0;
      if (r.condition === 'Underutilized') {
        underutilizedResourcesCount += r.unusedQuantity || r.totalQuantity || 0;
      }
      if (r.condition === 'Needs Repair') {
        needingRepairCount += r.needsRepairCount || r.totalQuantity || 0;
      }
    });

    // Requirements & Shortages
    const requirements = await Requirement.find();
    const schoolsWithShortagesSet = new Set();
    let pendingRequests = 0;
    let approvedRequests = 0;
    let rejectedRequests = 0;

    requirements.forEach((req) => {
      if (req.shortageQuantity > 0) {
        schoolsWithShortagesSet.add(req.schoolId.toString());
      }
      if (req.status === 'Submitted' || req.status === 'Pending') {
        pendingRequests++;
      } else if (req.status === 'Approved') {
        approvedRequests++;
      } else if (req.status === 'Rejected') {
        rejectedRequests++;
      }
    });

    res.json({
      totalSchools,
      totalResources: totalResourcesCount,
      unusedResources: unusedResourcesCount,
      underutilizedResources: underutilizedResourcesCount,
      resourcesNeedingRepair: needingRepairCount,
      schoolsWithShortages: schoolsWithShortagesSet.size,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /ai/analyze-allocations — AI Decision Support (Gemini, read-only) ──
// Analyzes the rule-engine candidates for a given requirement using Gemini AI.
// Returns a ranked list with scores and explanations for the Officer to review.
// This endpoint NEVER modifies any database record.
// Requires: { requirementId: string } in request body.
router.post('/ai/analyze-allocations', async (req, res) => {
  try {
    const { requirementId } = req.body;
    if (!requirementId) {
      return res.status(400).json({ success: false, error: 'requirementId is required in request body.' });
    }
    const result = await analyzeAllocationCandidates(requirementId);
    // Return the result regardless of success/failure (frontend shows error state)
    return res.json(result);
  } catch (error) {
    console.error('[AI Route Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error during AI analysis.', errorType: 'SERVER_ERROR' });
  }
});

export default router;
