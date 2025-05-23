import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import sendEmail from '../utils/sendEmail.js';
import emailTemplate from '../utils/emailTemplate.js';
import generateToken from '../utils/Token.js';
import ApiError from '../utils/apiError.js';
import Review from '../models/reviewModel.js';

/**
 * @middleware
 */

const createFilterObject = (req, res, next) => {
  const filterObject = {};
  // If specialtyId is present, filter by specialty
  if (req.params.specialtyId) {
    filterObject.specialty = req.params.specialtyId;
  }
  req.filterObject = filterObject;
  next();
};

/**
 * @desc    Create new user
 * @route   POST /api/v1/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ApiError('Email is already in use', 400));
  }

  const user = await User.create(req.body);
  sendEmail({
    email: req.body.email,
    subject: 'Verification Email',
    html: emailTemplate(generateToken(user._id)),
  });

  res.status(201).json({
    message: 'success',
    user,
  });
});

/**
 * @desc    Get specific user by id
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
const getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .populate({
      path: 'specialty',
      select: 'name description',
    })
    .populate({
      path: 'reviews',
      populate: {
        path: 'patient',
        select: 'fullName profileImage',
      },
      options: { sort: { createdAt: -1 } },
    });

  if (!user) {
    return next(new ApiError(`There isn't a user for this ${id}`, 404));
  }

  // Transform the response
  const userObj = user.toObject();
  if (userObj.specialty) {
    userObj.specialty = userObj.specialty.name;
  }

  res.status(200).json({
    message: 'success',
    data: userObj,
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find(req.filterObject).populate({
    path: 'specialty',
    select: 'name description',
  });

  res.status(200).json({
    message: 'success',
    results: users.length,
    users,
  });
});

/**
 * @desc    Update specific user
 * @route   PUT /api/v1/users/:id
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new ApiError(`There is no user with ID ${id}`, 404));
  }

  res.status(200).json({ message: 'success', user: user });
});

/**
 * @desc    Delete specific user
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return next(new ApiError(`There isn't a user for this ${id}`, 404));
  }

  res.status(200).json({ message: 'success' });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/users/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: 'specialty',
    select: 'name description',
  });

  if (!user) {
    return next(new ApiError('User not found', 404));
  }
  // Transform the response
  const userObj = user.toObject();
  if (userObj.specialty) {
    userObj.specialty = userObj.specialty.name;
  }

  res.status(200).json({
    message: 'success',
    data: userObj,
  });
});

/**
 * @desc    Update logged in user data
 * @route   PUT /api/v1/users/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const userRole = req.user.role;

  // Filter out unwanted fields that shouldn't be updated
  const allowedPatientFields = [
    'fullName',
    'email',
    'phoneNumber',
    'gender',
    'age',
    'height',
    'weight',
    'bloodType',
    'medicalCondition',
    'chronicDiseases',
    'currentMedications',
  ];

  const allowedDoctorFields = [
    'fullName',
    'email',
    'phoneNumber',
    'gender',
    'specialty',
    'clinicLocation',
    'certifications',
    'ProfessionalBio',
    'YearsOfExperience',
  ];

  const allowedFields =
    userRole === 'doctor' ? allowedDoctorFields : allowedPatientFields;

  const filteredBody = {};

  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // For updates that don't include workingHours, we can use findByIdAndUpdate
  const updatedUser = await User.findByIdAndUpdate(id, filteredBody, {
    new: true,
  });

  if (!updatedUser) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

/**
 * @desc    Update doctor's working hours
 * @route   PATCH /api/v1/users/updateWorkingHours
 * @access  Private/Doctor
 */
const updateWorkingHours = asyncHandler(async (req, res, next) => {
  const doctorId = req.user._id;
  const { workingHours } = req.body;

  if (!workingHours || !Array.isArray(workingHours)) {
    return next(
      new ApiError('Working hours must be provided as an array', 400)
    );
  }

  // Validate that workingHours has the required structure
  const validDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const isValid = workingHours.every(
    hour =>
      validDays.includes(hour.day) &&
      ((hour.from && hour.to) || (!hour.from && !hour.to))
  );

  if (!isValid) {
    return next(
      new ApiError(
        'Invalid working hours format. Each item must have day and both from and to if the day is available',
        400
      )
    );
  }

  // Get the doctor and update working hours
  const doctor = await User.findById(doctorId);

  if (!doctor) {
    return next(new ApiError('Doctor not found', 404));
  }

  doctor.workingHours = workingHours;

  await doctor.save();

  res.status(200).json({
    status: 'success',
    message: 'Working hours updated successfully',
    data: {
      workingHours: doctor.workingHours,
      availability: doctor.availability,
    },
  });
});

/**
 * @desc    Upload user profile image
 * @route   POST /api/v1/users/uploadImage
 * @access  Private
 */
const uploadUserImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError('Please upload profile image', 400));
  }

  req.body.profileImage = req.file.path;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: req.body.profileImage },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    message: 'success',
    user,
  });
});

/**
 * @desc    Upload user medical documents
 * @route   POST /api/v1/users/uploadMedicalDocuments
 * @access  Private
 */
const uploadMedicalDocuments = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError('Please upload medical documents', 400));
  }

  // Prepare the documents array from uploaded files
  const documents = req.files.map(file => ({
    fileName: file.originalname,
    fileUrl: file.path,
  }));

  // Get the user and update the MedicalDocuments array
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Add new documents to the existing array
  if (!user.MedicalDocuments) {
    user.MedicalDocuments = [];
  }

  user.MedicalDocuments.push(...documents);
  await user.save();

  res.status(200).json({
    message: 'success',
    medicalDocuments: user.MedicalDocuments,
  });
});

/**
 * @desc    Change current user password
 * @route   PATCH /api/v1/users/changePassword
 * @access  Private
 */
const changeMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, password } = req.body;

  // 1) Get user from database
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if current password is correct
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new ApiError('Current password is incorrect', 401));
  }

  // 3) Update password
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Generate token
  const token = generateToken(user._id);

  // 5) Return response
  res.status(200).json({
    message: 'Password changed successfully',
    token,
  });
});

/**
 * @desc    Change password for specific user (Admin only)
 * @route   PATCH /api/v1/users/changePassword/:id
 * @access  Private/Admin
 */
const changeUserPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { id } = req.params;

  // 1) Get user from database
  const user = await User.findById(id);
  if (!user) {
    return next(new ApiError(`User with ID ${id} not found`, 404));
  }

  // 2) Update password
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 3) Return response
  res.status(200).json({
    message: 'Password changed successfully',
  });
});

/**
 * @desc    Get all doctors
 * @route   GET /api/v1/users/doctors
 * @access  Public
 */
const getAllDoctors = asyncHandler(async (req, res, next) => {
  const doctors = await User.find({ role: 'doctor' })
    .populate({
      path: 'specialty',
      select: 'name description',
    })
    .select(
      'fullName email phoneNumber gender specialty workPlace clinicLocation certifications YearsOfExperience ProfessionalBio workingHours availability averageRating numberOfReviews'
    );

  res.status(200).json({
    message: 'success',
    results: doctors.length,
    data: doctors,
  });
});

/**
 * @desc    Get user medical documents
 * @route   GET /api/v1/users/getMedicalDocuments
 * @access  Private
 */
const getMedicalDocuments = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json({
    message: 'success',
    results: user.medicalDocuments.length,
    data: user.medicalDocuments,
  });
});

export {
  createFilterObject,
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  uploadUserImage,
  changeMyPassword,
  changeUserPassword,
  updateWorkingHours,
  getAllDoctors,
  uploadMedicalDocuments,
  getMedicalDocuments,
};
