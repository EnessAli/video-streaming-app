/*
  User model
  Used for registration, login and authorization operations.
  Roles: viewer (watch only), editor (upload+edit), admin (full access)
  Password is hashed with bcrypt, refresh tokens are stored in an array
*/
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username can be at most 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Password is not returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'editor'
    },
    // Track refresh tokens — can be active on multiple devices
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true }
      }
    ]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Don't re-hash if password hasn't changed
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// For password comparison during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive information when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
