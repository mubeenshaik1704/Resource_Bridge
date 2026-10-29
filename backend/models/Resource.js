import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
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
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  inUseQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  unusedQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  condition: {
    type: String,
    required: true,
    enum: [
      'In Use',
      'Unused',
      'Underutilized',
      'Needs Repair',
      'Damaged'
    ],
    default: 'In Use'
  },
  goodConditionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  needsRepairCount: {
    type: Number,
    default: 0,
    min: 0
  },
  purchaseYear: {
    type: Number,
    required: true
  },
  maintenanceStatus: {
    type: String,
    required: true,
    trim: true,
    default: 'Operational'
  },
  schoolLocation: {
    type: String,
    required: true,
    trim: true,
    default: 'Main Building'
  },
  estimatedUnitValue: {
    type: Number,
    default: 15000, // Approximate market procurement cost per unit in ₹
    min: 0
  },
  estimatedRepairCostPerUnit: {
    type: Number,
    default: 1500, // Approximate repair cost per unit in ₹
    min: 0
  },
  lifecycleStatus: {
    type: String,
    enum: ['Available', 'In Use', 'Underutilized', 'Needs Repair', 'Repaired'],
    default: 'In Use'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to ensure unusedQuantity = totalQuantity - inUseQuantity if not manually supplied
resourceSchema.pre('save', function (next) {
  if (this.totalQuantity !== undefined && this.inUseQuantity !== undefined) {
    if (this.unusedQuantity === undefined || this.unusedQuantity === null) {
      this.unusedQuantity = Math.max(0, this.totalQuantity - this.inUseQuantity);
    }
  }
  this.updatedAt = new Date();
  next();
});

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
