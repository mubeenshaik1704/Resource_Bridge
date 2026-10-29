import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  resourceName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Computers',
      'Projectors',
      'Laboratory Equipment',
      'Books',
      'Furniture',
      'Sports Equipment',
      'Other'
    ],
    default: 'Other'
  },
  requiredQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  shortageQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Submitted'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate shortage before saving: Shortage = max(0, required - available)
requirementSchema.pre('save', function (next) {
  this.shortageQuantity = Math.max(0, this.requiredQuantity - this.availableQuantity);
  next();
});

const Requirement = mongoose.model('Requirement', requirementSchema);
export default Requirement;
