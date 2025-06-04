import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import MedicalRecord from '../models/medicalRecordModel.js';

// @desc    Get all medical records (Admin Only)
// @route   GET /api/v1/medical-records
// @access  Private/Admin
export const getAllMedicalRecords = asyncHandler(async (req, res) => {
  const medicalRecords = await MedicalRecord.find()
    .populate('patient', 'fullName')
    .populate('doctor', 'fullName specialty')
    .populate('appointment', 'appointmentDate reasonForVisit');

  res.status(200).json({
    status: 'success',
    results: medicalRecords.length,
    data: {
      medicalRecords,
    },
  });
});

// @desc    Get all medical records for a specific patient
// @route   GET /api/v1/medical-records/patient/:patientId
// @access  Private
export const getPatientMedicalRecords = asyncHandler(async (req, res, next) => {
  const { patientId } = req.params;

  // If doctor, check if patient is in their patients list
  if (req.user.role === 'doctor' && !req.user.patients.includes(patientId)) {
    return next(
      new ApiError("You are not authorized to view this patient's records", 403)
    );
  }

  const medicalRecords = await MedicalRecord.find({ patient: patientId })
    .populate('doctor', 'fullName specialty')
    .populate('appointment', 'appointmentDate reasonForVisit diagnosis')
    .sort('-appointmentDate');

  res.status(200).json({
    status: 'success',
    results: medicalRecords.length,
    data: {
      medicalRecords,
    },
  });
});

// @desc    Get my medical records (Patient)
// @route   GET /api/v1/medical-records/my-records
// @access  Private
export const getMyMedicalRecords = asyncHandler(async (req, res) => {
  let medicalRecords;

  if (req.user.role === 'doctor') {
    medicalRecords = await MedicalRecord.find({ doctor: req.user._id })
      .populate('doctor', 'fullName specialty')
      .populate('patient', 'fullName')
      .populate('appointment', 'appointmentDate reasonForVisit diagnosis')
      .sort('-appointmentDate');
  } else {
    medicalRecords = await MedicalRecord.find({ patient: req.user._id })
      .populate('doctor', 'fullName specialty')
      .populate('patient', 'fullName')
      .populate('appointment', 'appointmentDate reasonForVisit diagnosis')
      .sort('-appointmentDate');
  }

  res.status(200).json({
    status: 'success',
    results: medicalRecords.length,
    data: medicalRecords,
  });
});

// @desc    Get specific medical record
// @route   GET /api/v1/medical-records/:id
// @access  Private
export const getMedicalRecord = asyncHandler(async (req, res, next) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'fullName')
    .populate('doctor', 'fullName specialty')
    .populate(
      'appointment',
      'appointmentDate reasonForVisit appointmentReport'
    );

  if (!medicalRecord) {
    return next(new ApiError('No medical record found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      medicalRecord,
    },
  });
});
