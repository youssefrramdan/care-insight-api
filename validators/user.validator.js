import { check } from 'express-validator';
import asyncHandler from 'express-async-handler';
import validatorMiddleware from '../middlewares/validatorMiddleware.js';
import User from '../models/userModel.js';
import Specialty from '../models/specialtyModel.js';

const registerPatientValidator = [
  // Validate email field
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async val => {
        const user = await User.findOne({ email: val });
        if (user) {
          throw new Error('Email already in use');
        }
      })
    ),

  // Password validation
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Required fields for patient details
  check('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters'),

  check('phoneNumber').notEmpty().withMessage('Phone number is required'),

  check('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female'])
    .withMessage("Gender must be either 'male' or 'female'"),

  // Optional fields
  check('age').optional().isNumeric().withMessage('Age must be a number'),

  check('height').optional().isNumeric().withMessage('Height must be a number'),

  check('weight').optional().isNumeric().withMessage('Weight must be a number'),

  check('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),

  check('medicalCondition').optional(),

  check('chronicDiseases')
    .optional()
    .isArray()
    .withMessage('chronicDiseases must be an array'),

  check('currentMedications')
    .optional()
    .isArray()
    .withMessage('currentMedications must be an array'),

  validatorMiddleware,
];

const registerDoctorValidator = [
  // Validate email field
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async val => {
        const user = await User.findOne({ email: val });
        if (user) {
          throw new Error('Email already in use');
        }
      })
    ),

  // Password validation
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Required fields for doctor details
  check('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters'),

  check('phoneNumber').notEmpty().withMessage('Phone number is required'),

  check('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female'])
    .withMessage("Gender must be either 'male' or 'female'"),

  check('specialtyId')
    .notEmpty()
    .withMessage('Specialty is required')
    .isMongoId()
    .withMessage('Invalid specialty ID format')
    .custom(
      asyncHandler(async val => {
        const specialty = await Specialty.findById(val);
        if (!specialty) {
          throw new Error('Specialty not found');
        }
      })
    ),

  check('clinicLocation').notEmpty().withMessage('Clinic location is required'),

  // Optional fields
  check('certifications')
    .optional()
    .isArray()
    .withMessage('certifications must be an array'),

  check('workingHours')
    .optional()
    .isArray()
    .withMessage('Working hours must be an array of objects'),

  validatorMiddleware,
];

const loginValidator = [
  check('email').isEmail().withMessage('Invalid email format'),

  check('password').notEmpty().withMessage('Password is required'),

  validatorMiddleware,
];

const createUserValidator = [
  // Validate email field
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async val => {
        const user = await User.findOne({ email: val });
        if (user) {
          throw new Error('Email already in use');
        }
      })
    ),

  // Password validation
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Required fields for user details
  check('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters'),

  check('phoneNumber').notEmpty().withMessage('Phone number is required'),

  check('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female'])
    .withMessage("Gender must be either 'male' or 'female'"),

  check('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['patient', 'doctor', 'admin'])
    .withMessage("Role must be either 'patient', 'doctor', or 'admin'"),

  validatorMiddleware,
];

const getUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),

  validatorMiddleware,
];

const updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),

  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const user = await User.findOne({ email: val });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('Email already in use');
        }
      })
    ),

  check('fullName')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters'),

  check('phoneNumber').optional(),

  check('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage("Gender must be either 'male' or 'female'"),

  validatorMiddleware,
];

const deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),

  validatorMiddleware,
];

const updateMeValidator = [
  // Prevent password update from this route
  check('password')
    .not()
    .exists()
    .withMessage(
      'This route is not for password updates. Please use /changePassword instead'
    ),

  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .custom(
      asyncHandler(async (val, { req }) => {
        const existingUser = await User.findOne({ email: val });
        if (
          existingUser &&
          existingUser._id.toString() !== req.user._id.toString()
        ) {
          throw new Error('Email already exists. Please use a different one.');
        }
        return true;
      })
    ),

  check('fullName')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters'),

  check('phoneNumber').optional(),

  check('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage("Gender must be either 'male' or 'female'"),

  // Patient-specific fields
  check('age').optional().isNumeric().withMessage('Age must be a number'),

  check('height').optional().isNumeric().withMessage('Height must be a number'),

  check('weight').optional().isNumeric().withMessage('Weight must be a number'),

  check('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),

  check('medicalCondition').optional(),

  check('chronicDiseases').optional(),

  check('currentMedications').optional(),

  // Doctor-specific fields
  check('specialtyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid specialty ID format')
    .custom(
      asyncHandler(async val => {
        const specialty = await Specialty.findById(val);
        if (!specialty) {
          throw new Error('Specialty not found');
        }
      })
    ),

  check('clinicLocation').optional(),

  check('certifications').optional(),

  check('workingHours')
    .optional()
    .isArray()
    .withMessage('Working hours must be an array'),

  validatorMiddleware,
];

const uploadUserImageValidator = [
  check('user').custom((val, { req }) => {
    if (!req.file) {
      throw new Error('Please upload profile image');
    }
    return true;
  }),
  validatorMiddleware,
];

const changeMyPasswordValidator = [
  check('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  check('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  validatorMiddleware,
];

const changeUserPasswordValidator = [
  check('id').isMongoId().withMessage('Invalid user ID format'),

  check('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  validatorMiddleware,
];

const forgetPasswordValidator = [
  check('email').isEmail().withMessage('Invalid email format'),

  validatorMiddleware,
];

const verifyResetCodeValidator = [
  check('resetCode')
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits'),

  validatorMiddleware,
];

const resetPasswordValidator = [
  check('email').isEmail().withMessage('Invalid email format'),

  check('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  validatorMiddleware,
];

export {
  registerPatientValidator,
  registerDoctorValidator,
  loginValidator,
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  uploadUserImageValidator,
  changeMyPasswordValidator,
  changeUserPasswordValidator,
  forgetPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
};
