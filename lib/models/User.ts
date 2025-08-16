import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    workExperience: [{
      id: Number,
      company: String,
      title: String,
      startDate: String,
      endDate: String,
      description: String
    }],
    education: [{
      id: Number,
      institution: String,
      degree: String,
      field: String,
      graduationDate: String
    }],
    skills: [String],
    personalSummary: String,
    phone: String,
    location: String
  },
  templates: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  // Use the simple approach - just store as mixed/any type like templates
  history: [mongoose.Schema.Types.Mixed],
  contacts: [mongoose.Schema.Types.Mixed],
  reminders: [mongoose.Schema.Types.Mixed],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);