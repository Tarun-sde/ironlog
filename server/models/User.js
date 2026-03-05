const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 60 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },

  // Profile (set during onboarding)
  height:   { type: Number, default: null },   // cm
  age:      { type: Number, default: null },
  gender:   { type: String, enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say', null], default: null },

  // Onboarding control
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save (Mongoose v8 compatible - no next() needed)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
