import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import sendEmail from '../utils/sendEmail.js';
import emailTemplate from '../utils/emailTemplate.js';
import generateToken from '../utils/Token.js';
import ApiError from '../utils/apiError.js';
import Review from '../models/reviewModel.js';
import Appointment from '../models/appointmentModel.js';
import medicalRecordModel from '../models/medicalRecordModel.js';

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
  const user = await User.findById(req.user._id)
    .populate({
      path: 'specialty',
      select: 'name description',
    })
    .populate({
      path: 'doctors',
      select: 'fullName email profileImage',
    })
    .populate({
      path: 'patients',
      select: 'fullName email profileImage',
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

  // Get the user and update the medicalDocuments array
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Add new documents to the existing array
  if (!user.medicalDocuments) {
    user.medicalDocuments = [];
  }

  user.medicalDocuments.push(...documents);
  await user.save();

  res.status(200).json({
    message: 'success',
    medicalDocuments: user.medicalDocuments,
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

/**
 * @desc    Delete medical document
 * @route   DELETE /api/v1/users/deleteMedicalDocument/:documentId
 * @access  Private
 */
const deleteMedicalDocument = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  const documentIndex = user.medicalDocuments.findIndex(
    doc => doc._id.toString() === documentId
  );

  if (documentIndex === -1) {
    return next(new ApiError('Document not found', 404));
  }

  // Remove the document from the array
  user.medicalDocuments.splice(documentIndex, 1);
  await user.save();

  res.status(200).json({
    message: 'success',
    data: user.medicalDocuments,
  });
});

/**
 * @desc    Get user statistics (appointments, medical records, etc)
 * @route   GET /api/v1/users/statistics
 * @access  Private
 */
const getUserStatistics = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const currentDate = new Date();
  const filter =
    req.user.role === 'doctor' ? { doctor: userId } : { patient: userId };

  // Run all queries in parallel
  const [appointments, medicalRecordsCount, user] = await Promise.all([
    // Get only upcoming appointments directly from DB
    Appointment.find({
      ...filter,
      appointmentDate: { $gt: currentDate },
      status: { $ne: 'cancelled' },
    })
      .sort({ appointmentDate: 1 })
      .populate('doctor', 'fullName specialty clinicLocation')
      .populate('patient', 'fullName')
      .populate('doctor.specialty', 'name'),

    // Get medical records count
    medicalRecordModel.countDocuments(filter),

    // Get user data
    User.findById(userId, 'medicalDocuments'),
  ]);

  // Process appointments data
  const upcomingAppointmentsList = appointments.map(app => ({
    id: app._id,
    date: app.appointmentDate,
    status: app.status,
    reasonForVisit: app.reasonForVisit,
    fullName:
      req.user.role === 'patient' ? app.doctor.fullName : app.patient.fullName,
    specialty: app.doctor.specialty?.name,
    clinicLocation: app.doctor.clinicLocation,
  }));

  // Process user documents
  const uploadedDocumentsCount = user.medicalDocuments?.length || 0;
  const recentFiles = user.medicalDocuments
    ? user.medicalDocuments
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 5)
    : [];

  res.status(200).json({
    status: 'success',
    data: {
      totalAppointments: appointments.length,
      upcomingAppointments: appointments.length,
      upcomingAppointmentsList,
      medicalRecordsCount,
      uploadedDocumentsCount,
      recentFiles,
    },
  });
});

/**
 * @desc    Get patient by id with all related data
 * @route   GET /api/v1/users/patients/:id
 * @access  Private
 */
const getPatientById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const patient = await User.findOne({ _id: id, role: 'patient' })
    .select('+medicalDocuments')
  if (!patient) {
    return next(new ApiError(`No patient found with ID ${id}`, 404));
  }

  // Get medical records for the patient
  const medicalRecords = await medicalRecordModel
    .find({ patient: id })
    .populate({
      path: 'doctor',
      select: 'fullName specialty',
    })
    .sort({ createdAt: -1 });

  // Transform the response
  const patientData = {
    personalInformation: {
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodType: patient.bloodType,
    },
    medicalCondition: {
      currentCondition: patient.medicalCondition,
      chronicDiseases: patient.chronicDiseases,
      currentMedications: patient.currentMedications,
    },
    contact: {
      email: patient.email,
      phoneNumber: patient.phoneNumber,
    },
    medicalRecords: medicalRecords.map(record => ({
      id: record._id,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      doctor: {
        name: record.doctor.fullName,
        specialty: record.doctor.specialty,
      },
      date: record.createdAt,
      notes: record.notes,
    })),
  };

  res.status(200).json({
    status: 'success',
    data: patientData,
  });
});

/**
 * @desc    Get patient files by patient id with optional filtering
 * @route   GET /api/v1/users/patients/:id/files
 * @access  Private
 */
const getPatientFiles = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { filterBy } = req.query;

  const patient = await User.findOne({ _id: id, role: 'patient' }).select(
    'medicalDocuments'
  );

  if (!patient) {
    return next(new ApiError(`No patient found with ID ${id}`, 404));
  }

  const getFileType = fileName => {
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) return 'image';
    if (fileName.match(/\.(pdf|doc|docx)$/i)) return 'document';
    return 'other';
  };

  const files = patient.medicalDocuments || [];

  // Create file categories
  const filesByType = {
    images: files.filter(doc => getFileType(doc.fileName) === 'image'),
    documents: files.filter(doc => getFileType(doc.fileName) === 'document'),
    other: files.filter(doc => getFileType(doc.fileName) === 'other'),
  };

  // Format files data
  const formatFiles = fileList =>
    fileList
      .map(doc => ({
        id: doc._id,
        name: doc.fileName,
        url: doc.fileUrl,
        uploadDate: doc.uploadDate,
        type: getFileType(doc.fileName),
      }))
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

  // Handle filtering
  let filteredFiles = files;
  const counts = {
    all: files.length,
    images: filesByType.images.length,
    documents: filesByType.documents.length,
    other: filesByType.other.length,
  };

  if (filterBy && filesByType[filterBy]) {
    filteredFiles = filesByType[filterBy];
  }

  const filesData = {
    counts,
    results: filteredFiles.length,
    files: formatFiles(filteredFiles),
  };

  res.status(200).json({
    status: 'success',
    data: filesData,
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
  deleteMedicalDocument,
  getUserStatistics,
  getPatientById,
  getPatientFiles,
};
