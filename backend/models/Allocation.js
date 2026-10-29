import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
  requirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requirement',
    required: true
  },
  donorSchoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  recipientSchoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  resourceName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  availableQuantityAtDonor: {
    type: Number,
    required: true
  },
  recommendedQuantity: {
    type: Number,
    required: true
  },
  donorResourceCondition: {
    type: String,
    required: true,
    default: 'Good'
  },
  distanceKm: {
    type: Number,
    required: true
  },
  estimatedTransportCost: {
    type: Number,
    required: true
  },
  estimatedRepairCost: {
    type: Number,
    default: 0
  },
  estimatedProcurementCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Recommended', 'Approved', 'Rejected'],
    default: 'Recommended'
  },
  officerRemarks: {
    type: String,
    default: ''
  },
  isAutomaticTransfer: {
    type: Boolean,
    default: false // Strictly false as per statutory rule
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Allocation = mongoose.model('Allocation', allocationSchema);
export default Allocation;
