import mongoose from 'mongoose';

const officerDecisionSchema = new mongoose.Schema({
  officerName: {
    type: String,
    required: true,
    trim: true
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requirement',
    required: true
  },
  allocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allocation'
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
  decisionType: {
    type: String,
    enum: [
      'Reallocation Approved',
      'Repair Approved',
      'New Procurement Approved',
      'Request Rejected'
    ],
    required: true
  },
  commentReason: {
    type: String,
    required: true,
    trim: true
  },
  estimatedCost: {
    type: Number,
    required: true,
    default: 0
  },
  decidedAt: {
    type: Date,
    default: Date.now
  }
});

const OfficerDecision = mongoose.model('OfficerDecision', officerDecisionSchema);
export default OfficerDecision;
