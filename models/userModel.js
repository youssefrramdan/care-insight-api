import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const workingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
    },
    from: String,
    to: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    profileImage: String,
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Gender is required'],
    },
    medicalDocuments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
    // Medical Information (Patient-specific)
    age: {
      type: Number,
    },
    height: {
      type: Number, // in cm
    },
    weight: {
      type: Number, // in kg
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    medicalCondition: {
      type: String,
    },
    chronicDiseases: {
      type: [String],
    },
    currentMedications: {
      type: [String],
    },
    // Doctor-specific fields
    specialty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialty',
    },
    workPlace: {
      type: String,
    },
    clinicLocation: {
      type: String,
    },
    certifications: {
      type: [String],
    },
    YearsOfExperience: {
      type: Number,
    },
    ProfessionalBio: {
      type: String,
    },
    workingHours: {
      type: [workingHoursSchema],
    },
    availability: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetExpires: Date,
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    passwordChangedAt: Date,
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save middleware to update availability based on workingHours
userSchema.pre('save', function (next) {
  if (this.role === 'doctor' && Array.isArray(this.workingHours)) {
    // Extract days where from and to are populated
    this.availability = this.workingHours
      .filter(hour => hour.from && hour.to)
      .map(hour => hour.day);
  }
  next();
});

// Method to check if entered password is correct
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
