const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'], // see documentation
  },
  photo: {
    type: String, // path of the image we're saving
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // enum validator, restrict to specific roles
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // never show passwords in output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!
      validator: function (el) {
        return el === this.password; // if pass.confirm is abc and password is abc - true
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, // hide active object from user
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password - bcrypt is asynchronus
  this.password = await bcrypt.hash(this.password, 12);

  // only need passwordConfirm for validation, dont want to persist in database
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // if password property isnt modified then dont manipulate the passwordChangedAt
  if (!this.isModified('password') || this.isNew) return next();

  // sometimes saving to the database is slower than issuing the json web token
  // hence passwordChangedTimestamp is set after the jwt has been created - hence they cant sign in with it.
  // we subract the passwordChangedAt by one second the passwordToken is always created after the passwords changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Regular to look for strings that start with find
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10 // defining the base - a base 10 number
    );
    console.log(changedTimestamp, JWTTimestamp); // Need to be as close as possible
    return JWTTimestamp < changedTimestamp; // 300 < 200
  }
  // False means not Changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // only the user has access to the token
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
