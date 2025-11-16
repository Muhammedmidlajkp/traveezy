

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
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

    // 🧩 Admin Management
    role: {
      type: String,
      enum: ['User', 'Admin', 'Editor', 'Viewer'],
      default: 'User',
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending', 'Suspended', 'Blocked'],
      default: 'Active',
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // 👤 Profile
    bio: {
      type: String,
      default: '',
    },

    profileImage: {
      type: String,
      default: '/assets/images/default-avatar.png',
    },

    avatar: {
      type: String,
      default: '/assets/images/default-avatar.png',
    },

    // 🌍 Onboarding Data
    onboarding: {
      location: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      interests: [{ type: String }],
      travelStart: { type: Date },
      travelEnd: { type: Date },
      notifications: {
        discoveries: { type: Boolean, default: false },
        recommendations: { type: Boolean, default: false },
        reminders: { type: Boolean, default: false },
      },
      completed: { type: Boolean, default: false },
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

// ✅ Hash password automatically before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;



