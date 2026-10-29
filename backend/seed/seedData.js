import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import School from '../models/School.js';
import Resource from '../models/Resource.js';
import Requirement from '../models/Requirement.js';
import Allocation from '../models/Allocation.js';
import OfficerDecision from '../models/OfficerDecision.js';

export const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking existing data in MongoDB...');
    const schoolCount = await School.countDocuments();
    if (schoolCount > 0) {
      console.log(`[Seeder] Database already populated with ${schoolCount} schools. Skipping seed.`);
      return { message: 'Database already seeded', schoolCount };
    }

    console.log('[Seeder] Cleaning existing collections...');
    await User.deleteMany({});
    await School.deleteMany({});
    await Resource.deleteMany({});
    await Requirement.deleteMany({});
    await Allocation.deleteMany({});
    await OfficerDecision.deleteMany({});

    // Hash default password
    const officerPasswordHash = await bcrypt.hash('officer123', 10);
    const schoolPasswordHash = await bcrypt.hash('school123', 10);

    // 1. Create Education Department Officer User
    const officerUser = await User.create({
      name: 'Dr. Rajesh Sharma',
      username: 'officer',
      password: officerPasswordHash,
      email: 'officer@education.gov.in',
      role: 'OFFICER'
    });

    // 2. Create Government Schools
    const schoolA = await School.create({
      schoolCode: 'SCH-001',
      schoolName: 'Government Model Senior Secondary School, Sector 4',
      district: 'South District',
      address: 'Sector 4, Main Institutional Area, South District',
      latitude: 28.5355,
      longitude: 77.2090,
      contactNumber: '+91 98765 43210',
      principalName: 'Smt. Sunita Verma',
      studentCount: 850,
      classroomCount: 24
    });

    const schoolB = await School.create({
      schoolCode: 'SCH-002',
      schoolName: 'Government Boys High School, Gandhi Nagar',
      district: 'Central District',
      address: 'Gandhi Nagar Main Road, Central District',
      latitude: 28.6507,
      longitude: 77.2334,
      contactNumber: '+91 98765 12345',
      principalName: 'Shri Ramesh Chand',
      studentCount: 620,
      classroomCount: 18
    });

    const schoolC = await School.create({
      schoolCode: 'SCH-003',
      schoolName: 'Government Girls Higher Secondary School, RK Puram',
      district: 'West District',
      address: 'Sector 3, RK Puram, West District',
      latitude: 28.5665,
      longitude: 77.1767,
      contactNumber: '+91 98765 67890',
      principalName: 'Dr. Meenakshi Sundaram',
      studentCount: 940,
      classroomCount: 26
    });

    const schoolD = await School.create({
      schoolCode: 'SCH-004',
      schoolName: 'Government Tribal Welfare School, North Ridge',
      district: 'North District',
      address: 'Hilltop Avenue, North Ridge',
      latitude: 28.7041,
      longitude: 77.1025,
      contactNumber: '+91 98765 99887',
      principalName: 'Shri Anand Kulkarni',
      studentCount: 410,
      classroomCount: 12
    });

    // 3. Create School Admin Users
    await User.create([
      {
        name: 'Smt. Sunita Verma (Principal)',
        username: 'schoola',
        password: schoolPasswordHash,
        email: 'schoolA@edu.gov.in',
        role: 'SCHOOL',
        schoolId: schoolA._id
      },
      {
        name: 'Shri Ramesh Chand (Principal)',
        username: 'schoolb',
        password: schoolPasswordHash,
        email: 'schoolB@edu.gov.in',
        role: 'SCHOOL',
        schoolId: schoolB._id
      },
      {
        name: 'Dr. Meenakshi Sundaram (Principal)',
        username: 'schoolc',
        password: schoolPasswordHash,
        email: 'schoolC@edu.gov.in',
        role: 'SCHOOL',
        schoolId: schoolC._id
      },
      {
        name: 'Shri Anand Kulkarni (Principal)',
        username: 'schoold',
        password: schoolPasswordHash,
        email: 'schoolD@edu.gov.in',
        role: 'SCHOOL',
        schoolId: schoolD._id
      }
    ]);

    // 4. Create Resources
    // School A Resources: Contains 8 UNUSED COMPUTERS (Potential Donor)
    await Resource.create([
      {
        schoolId: schoolA._id,
        resourceName: 'Desktop Computer (i5, 8GB RAM)',
        category: 'Computers',
        totalQuantity: 20,
        inUseQuantity: 12,
        unusedQuantity: 8,
        condition: 'Unused',
        goodConditionCount: 6,
        needsRepairCount: 2,
        purchaseYear: 2022,
        maintenanceStatus: 'Regularly Serviced',
        schoolLocation: 'IT Lab - Room 204',
        estimatedUnitValue: 30000,
        estimatedRepairCostPerUnit: 2500,
        lifecycleStatus: 'Underutilized'
      },
      {
        schoolId: schoolA._id,
        resourceName: 'Digital Projector (Full HD)',
        category: 'Projectors',
        totalQuantity: 4,
        inUseQuantity: 4,
        unusedQuantity: 0,
        condition: 'In Use',
        goodConditionCount: 4,
        needsRepairCount: 0,
        purchaseYear: 2023,
        maintenanceStatus: 'Operational',
        schoolLocation: 'Auditorium & Class 10A',
        estimatedUnitValue: 45000,
        estimatedRepairCostPerUnit: 3000,
        lifecycleStatus: 'In Use'
      },
      {
        schoolId: schoolA._id,
        resourceName: 'Physics Laboratory Equipment Kit',
        category: 'Laboratory Equipment',
        totalQuantity: 15,
        inUseQuantity: 10,
        unusedQuantity: 5,
        condition: 'Unused',
        goodConditionCount: 5,
        needsRepairCount: 0,
        purchaseYear: 2021,
        maintenanceStatus: 'Good Condition',
        schoolLocation: 'Physics Lab - Room 102',
        estimatedUnitValue: 12000,
        estimatedRepairCostPerUnit: 1200,
        lifecycleStatus: 'Available'
      },
      {
        schoolId: schoolA._id,
        resourceName: 'Dual-Desk Wooden Benches',
        category: 'Furniture',
        totalQuantity: 150,
        inUseQuantity: 130,
        unusedQuantity: 20,
        condition: 'Unused',
        goodConditionCount: 20,
        needsRepairCount: 0,
        purchaseYear: 2022,
        maintenanceStatus: 'Good',
        schoolLocation: 'Ground Floor Storage',
        estimatedUnitValue: 2200,
        estimatedRepairCostPerUnit: 400,
        lifecycleStatus: 'Available'
      }
    ]);

    // School B Resources: Has only 5 Computers (Will have shortage of 15)
    await Resource.create([
      {
        schoolId: schoolB._id,
        resourceName: 'Desktop Computer (i5, 8GB RAM)',
        category: 'Computers',
        totalQuantity: 5,
        inUseQuantity: 5,
        unusedQuantity: 0,
        condition: 'In Use',
        goodConditionCount: 5,
        needsRepairCount: 0,
        purchaseYear: 2020,
        maintenanceStatus: 'Functional but aged',
        schoolLocation: 'Office Computer Lab',
        estimatedUnitValue: 30000,
        estimatedRepairCostPerUnit: 2500,
        lifecycleStatus: 'In Use'
      },
      {
        schoolId: schoolB._id,
        resourceName: 'Classroom Desks & Benches',
        category: 'Furniture',
        totalQuantity: 110,
        inUseQuantity: 100,
        unusedQuantity: 10,
        condition: 'In Use',
        goodConditionCount: 95,
        needsRepairCount: 15,
        purchaseYear: 2021,
        maintenanceStatus: 'Minor Repairs Needed',
        schoolLocation: 'Rooms 1 to 10',
        estimatedUnitValue: 2200,
        estimatedRepairCostPerUnit: 350,
        lifecycleStatus: 'In Use'
      }
    ]);

    // School C Resources: Has underutilized projectors & computers needing repair
    await Resource.create([
      {
        schoolId: schoolC._id,
        resourceName: 'Interactive Smart Board Projector',
        category: 'Projectors',
        totalQuantity: 6,
        inUseQuantity: 2,
        unusedQuantity: 4,
        condition: 'Underutilized',
        goodConditionCount: 4,
        needsRepairCount: 0,
        purchaseYear: 2023,
        maintenanceStatus: 'Barely Used',
        schoolLocation: 'Senior Block',
        estimatedUnitValue: 55000,
        estimatedRepairCostPerUnit: 3500,
        lifecycleStatus: 'Underutilized'
      },
      {
        schoolId: schoolC._id,
        resourceName: 'Desktop Computer (Core i3)',
        category: 'Computers',
        totalQuantity: 25,
        inUseQuantity: 15,
        unusedQuantity: 0,
        condition: 'Needs Repair',
        goodConditionCount: 15,
        needsRepairCount: 10,
        purchaseYear: 2019,
        maintenanceStatus: 'Power supply & RAM failure',
        schoolLocation: 'Old IT Lab',
        estimatedUnitValue: 25000,
        estimatedRepairCostPerUnit: 2500,
        lifecycleStatus: 'Needs Repair'
      }
    ]);

    // School D Resources: Has damaged furniture
    await Resource.create([
      {
        schoolId: schoolD._id,
        resourceName: 'Library Reference Books Set',
        category: 'Books',
        totalQuantity: 450,
        inUseQuantity: 300,
        unusedQuantity: 150,
        condition: 'Unused',
        goodConditionCount: 150,
        needsRepairCount: 0,
        purchaseYear: 2023,
        maintenanceStatus: 'Excellent',
        schoolLocation: 'School Library',
        estimatedUnitValue: 500,
        estimatedRepairCostPerUnit: 50,
        lifecycleStatus: 'Available'
      },
      {
        schoolId: schoolD._id,
        resourceName: 'Classroom Desks',
        category: 'Furniture',
        totalQuantity: 60,
        inUseQuantity: 40,
        unusedQuantity: 0,
        condition: 'Damaged',
        goodConditionCount: 40,
        needsRepairCount: 20,
        purchaseYear: 2018,
        maintenanceStatus: 'Severely Broken',
        schoolLocation: 'Backyard Shed',
        estimatedUnitValue: 2000,
        estimatedRepairCostPerUnit: 600,
        lifecycleStatus: 'Needs Repair'
      }
    ]);

    // 5. Create Requirements (Shortages)
    // School B requires 20 computers, has 5 => Shortage: 15
    const reqSchoolB = await Requirement.create({
      schoolId: schoolB._id,
      resourceName: 'Desktop Computer (i5, 8GB RAM)',
      category: 'Computers',
      requiredQuantity: 20,
      availableQuantity: 5,
      shortageQuantity: 15,
      urgency: 'High',
      reason: 'Setting up new digital literacy curriculum for Class 9 and 10 students.',
      status: 'Submitted'
    });

    // School D requires 8 Science Lab Kits, has 1 => Shortage: 7
    const reqSchoolD = await Requirement.create({
      schoolId: schoolD._id,
      resourceName: 'Physics Laboratory Equipment Kit',
      category: 'Laboratory Equipment',
      requiredQuantity: 8,
      availableQuantity: 1,
      shortageQuantity: 7,
      urgency: 'Medium',
      reason: 'Conducting practical science experiments for Class 8 students.',
      status: 'Submitted'
    });

    // 6. Create Potential Allocation Recommendation (Rule-based, Non-AI)
    // School A has 8 unused computers -> Recommend allocation to School B
    // Distance ~ 13.1 km, estimated transport cost: ₹4,000
    // Comparison: Repair ₹2,500, Reallocation transport ₹4,000, New procurement ₹2,40,000
    await Allocation.create({
      requirementId: reqSchoolB._id,
      donorSchoolId: schoolA._id,
      recipientSchoolId: schoolB._id,
      resourceName: 'Desktop Computer (i5, 8GB RAM)',
      category: 'Computers',
      availableQuantityAtDonor: 8,
      recommendedQuantity: 8,
      donorResourceCondition: 'Good (6 units ready, 2 minor servicing)',
      distanceKm: 13.1,
      estimatedTransportCost: 4000,
      estimatedRepairCost: 2500,
      estimatedProcurementCost: 240000, // 8 * 30000 = ₹2,40,000
      status: 'Recommended',
      officerRemarks: 'Potential reallocation identified from School A surplus. Officer review required before any action.'
    });

    // 7. Create a Sample Past Decision in History
    await OfficerDecision.create({
      officerName: 'Dr. Rajesh Sharma',
      officerId: officerUser._id,
      requirementId: reqSchoolD._id,
      recipientSchoolId: schoolD._id,
      resourceName: 'Laboratory Equipment Kit',
      decisionType: 'Reallocation Approved',
      commentReason: 'Approved reallocation of 5 kits from School A surplus storage to School D tribal school. Transport funded under district science outreach scheme.',
      estimatedCost: 1500,
      decidedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });

    console.log('[Seeder] Database successfully populated with realistic government schools and resource scenarios!');
    return {
      message: 'Seed completed successfully',
      officer: officerUser.email,
      schoolsCreated: 4,
      resourcesCreated: 8,
      requirementsCreated: 2,
      recommendationsCreated: 1,
      decisionsCreated: 1
    };
  } catch (error) {
    console.error('[Seeder] Error populating database:', error);
    throw error;
  }
};
