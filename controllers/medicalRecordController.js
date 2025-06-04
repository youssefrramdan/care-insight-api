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
  const { search } = req.query;

  // Start with the role-based match stage
  const matchStage =
    req.user.role === 'doctor'
      ? { doctor: req.user._id }
      : { patient: req.user._id };

  // Create the pipeline
  const pipeline = [
    {
      $match: matchStage,
    },
    // Lookup appointments
    {
      $lookup: {
        from: 'appointments',
        localField: 'appointment',
        foreignField: '_id',
        as: 'appointmentData',
      },
    },
    // Lookup patients
    {
      $lookup: {
        from: 'users',
        localField: 'patient',
        foreignField: '_id',
        as: 'patientData',
      },
    },
    // Lookup doctors
    {
      $lookup: {
        from: 'users',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctorData',
      },
    },
    // Unwind the arrays created by lookups
    {
      $unwind: '$appointmentData',
    },
    {
      $unwind: '$patientData',
    },
    {
      $unwind: '$doctorData',
    },
  ];

  // Add search condition if search parameter exists
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'appointmentData.diagnosis': { $regex: search, $options: 'i' } },
          {
            'appointmentData.reasonForVisit': { $regex: search, $options: 'i' },
          },
          { 'patientData.fullName': { $regex: search, $options: 'i' } },
          { 'doctorData.fullName': { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  // Add final projection to format the output
  pipeline.push({
    $project: {
      _id: 1,
      appointment: {
        _id: '$appointmentData._id',
        appointmentDate: '$appointmentData.appointmentDate',
        reasonForVisit: '$appointmentData.reasonForVisit',
        diagnosis: '$appointmentData.diagnosis',
      },
      patient: {
        _id: '$patientData._id',
        fullName: '$patientData.fullName',
      },
      doctor: {
        _id: '$doctorData._id',
        fullName: '$doctorData.fullName',
        specialty: '$doctorData.specialty',
      },
      createdAt: 1,
      updatedAt: 1,
    },
  });

  // Add sorting
  pipeline.push({
    $sort: { 'appointment.appointmentDate': -1 },
  });

  const medicalRecords = await MedicalRecord.aggregate(pipeline);

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
