import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  schoolCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  principalName: {
    type: String,
    required: true,
    trim: true
  },
  studentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  classroomCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const School = mongoose.model('School', schoolSchema);
export default School;
