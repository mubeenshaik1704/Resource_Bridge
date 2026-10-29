import School from '../models/School.js';
import Resource from '../models/Resource.js';
import Requirement from '../models/Requirement.js';
import Allocation from '../models/Allocation.js';

/**
 * Calculates geodesic distance between two coordinate points using the Haversine formula (Non-AI).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers rounded to 1 decimal place
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 10.0; // Default approximation if coordinates missing
  }
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Calculates estimated freight transport cost based on distance and unit quantity.
 * Formula: Base fee (₹1,500) + Distance rate (₹120/km) + Unit loading/insurance (₹100/unit)
 * Rounded to nearest ₹500 for clean budget estimation.
 */
export const calculateTransportCost = (distanceKm, quantity) => {
  const baseRate = 1500;
  const distanceCharge = distanceKm * 120;
  const unitHandling = (quantity || 1) * 100;
  const total = baseRate + distanceCharge + unitHandling;
  return Math.round(total / 500) * 500;
};

/**
 * Scans all requirements with shortages and identifies potential surplus donor schools.
 * Enforces the Statutory Rule: Generates recommendation only (NO automatic transfer).
 */
export const generatePotentialAllocations = async () => {
  try {
    console.log('[Allocation Engine] Running non-AI rule-based allocation scan...');
    const activeRequirements = await Requirement.find({
      shortageQuantity: { $gt: 0 },
      status: { $in: ['Submitted', 'Pending', 'Under Review'] }
    }).populate('schoolId');

    const generated = [];

    for (const req of activeRequirements) {
      const recipientSchool = req.schoolId;
      if (!recipientSchool) continue;

      // 1. Find donor candidate resources from OTHER schools with unused surplus (> 0)
      const donorCandidates = await Resource.find({
        schoolId: { $ne: recipientSchool._id },
        category: req.category,
        unusedQuantity: { $gt: 0 }
      }).populate('schoolId');

      for (const donorResource of donorCandidates) {
        const donorSchool = donorResource.schoolId;
        if (!donorSchool) continue;

        // 2. Calculate distance between schools
        const distanceKm = calculateHaversineDistance(
          donorSchool.latitude,
          donorSchool.longitude,
          recipientSchool.latitude,
          recipientSchool.longitude
        );

        // 3. Recommended quantity is min(donor surplus, shortage needed)
        const recommendedQty = Math.min(donorResource.unusedQuantity, req.shortageQuantity);
        if (recommendedQty <= 0) continue;

        // 4. Calculate transportation cost
        const transportCost = calculateTransportCost(distanceKm, recommendedQty);

        // 5. Calculate Cost Comparison Options:
        // Option 1: Repair existing (if recipient has units needing repair)
        const recipientExisting = await Resource.findOne({
          schoolId: recipientSchool._id,
          category: req.category
        });
        const repairCostPerUnit = donorResource.estimatedRepairCostPerUnit || recipientExisting?.estimatedRepairCostPerUnit || 2500;
        const repairUnits = recipientExisting?.needsRepairCount || 1;
        const estimatedRepairCost = Math.max(2500, repairUnits * repairCostPerUnit);

        // Option 3: New Procurement
        const unitVal = donorResource.estimatedUnitValue || 30000;
        const estimatedProcurementCost = recommendedQty * unitVal;

        // 6. Donor condition description
        const donorConditionStr = `${donorResource.condition} (${donorResource.goodConditionCount || recommendedQty} in good condition${
          donorResource.needsRepairCount > 0 ? `, ${donorResource.needsRepairCount} needs servicing` : ''
        })`;

        // 7. Check if recommendation already recorded for this requirement and donor
        let allocation = await Allocation.findOne({
          requirementId: req._id,
          donorSchoolId: donorSchool._id
        });

        if (allocation) {
          allocation.recommendedQuantity = recommendedQty;
          allocation.availableQuantityAtDonor = donorResource.unusedQuantity;
          allocation.distanceKm = distanceKm;
          allocation.estimatedTransportCost = transportCost;
          allocation.estimatedRepairCost = estimatedRepairCost;
          allocation.estimatedProcurementCost = estimatedProcurementCost;
          allocation.donorResourceCondition = donorConditionStr;
          await allocation.save();
        } else {
          allocation = await Allocation.create({
            requirementId: req._id,
            donorSchoolId: donorSchool._id,
            recipientSchoolId: recipientSchool._id,
            resourceName: req.resourceName,
            category: req.category,
            availableQuantityAtDonor: donorResource.unusedQuantity,
            recommendedQuantity: recommendedQty,
            donorResourceCondition: donorConditionStr,
            distanceKm,
            estimatedTransportCost: transportCost,
            estimatedRepairCost,
            estimatedProcurementCost,
            status: 'Recommended',
            isAutomaticTransfer: false, // Statutory rule enforced
            officerRemarks: `Potential allocation option: ${donorSchool.schoolName} has ${donorResource.unusedQuantity} unused surplus. Transfer of ${recommendedQty} units recommended for Officer approval.`
          });
        }

        generated.push(allocation);
      }
    }

    console.log(`[Allocation Engine] Scan complete. Identified ${generated.length} potential allocation recommendation(s).`);
    return generated;
  } catch (error) {
    console.error('[Allocation Engine Error]', error);
    throw error;
  }
};
