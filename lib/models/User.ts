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
  history: [mongoose.Schema.Types.Mixed],
  // ENHANCED CONTACTS SCHEMA
  contacts: [{
    id: String,
    name: String,
    company: String,
    position: String,
    email: String,
    linkedinUrl: String,
    status: {
      type: String,
      enum: ['contacted', 'responded', 'no_response', 'follow_up_sent', 'connected'],
      default: 'contacted'
    },
    originalMessage: String, // Store the generated email/letter
    lastMessageType: {
      type: String,
      enum: ['email', 'cover_letter']
    },
    lastFollowUpMessage: String,
    lastLinkedInMessage: String,
    followUpCount: {
      type: Number,
      default: 0
    },
    notes: String,
    createdAt: String,
    lastContacted: String,
    responseReceived: {
      type: Boolean,
      default: false
    }
  }],
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