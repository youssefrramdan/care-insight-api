import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';
import MedicalRecord from '../models/medicalRecordModel.js';

// Create new appointment
export const createAppointment = asyncHandler(async (req, res, next) => {
  const { doctor, appointmentDate, reasonForVisit, notes } = req.body;

  // Validate appointment date is in the future
  //   if (new Date(appointmentDate) < new Date()) {
  //     return next(new ApiError('Appointment date must be in the future', 400));
  //   }

  const appointment = await Appointment.create({
    doctor,
    patient: req.user._id, // Current logged in user
    appointmentDate,
    reasonForVisit,
    notes,
  });

  // Add patient to doctor's patients array and doctor to patient's doctors array
  await Promise.all([
    // Add patient to doctor's patients array if not already there
    User.findByIdAndUpdate(doctor, {
      $addToSet: { patients: req.user._id }, // $addToSet ensures no duplicates
    }),
    // Add doctor to patient's doctors array if not already there
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { doctors: doctor }, // $addToSet ensures no duplicates
    }),
  ]);

  res.status(201).json({
    status: 'success',
    data: {
      appointment,
    },
  });
});

// Upload files for appointment
export const uploadAppointmentFiles = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.appointmentId);

  if (!appointment) {
    return next(new ApiError('No appointment found with that ID', 404));
  }

  // Check if user has permission to upload files for this appointment
  if (
    req.user.role !== 'admin' &&
    appointment.patient.toString() !== req.user._id.toString() &&
    appointment.doctor.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError(
        'You do not have permission to upload files for this appointment',
        403
      )
    );
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return next(new ApiError('Please upload at least one file', 400));
  }
  let newFiles = [];
  if (req.files) {
    newFiles = req.files.map(file => ({
      fileName: file.filename,
      fileUrl: file.path,
      fileType: file.mimetype,
      uploadDate: new Date(),
    }));
  }

  // Add new files to the appointment
  appointment.uploadedFiles = appointment.uploadedFiles || [];
  appointment.uploadedFiles.push(...newFiles);

  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment,
    },
  });
});

// Get all appointments (with filters for doctor/patient)
export const getAllAppointments = asyncHandler(async (req, res, next) => {
  const filter = {};
  const currentDate = new Date();

  // If user is a doctor, show their appointments
  if (req.user.role === 'doctor') {
    filter.doctor = req.user._id;
  }

  // If user is a patient, show their appointments
  if (req.user.role === 'patient') {
    filter.patient = req.user._id;
  }

  // Add date filter based on type (upcoming or past)
  if (req.query.type === 'upcoming') {
    filter.appointmentDate = { $gt: currentDate };
    filter.status = { $ne: 'cancelled' }; // Don't show cancelled appointments in upcoming
  } else if (req.query.type === 'past') {
    filter.appointmentDate = { $lt: currentDate };
  }

  const appointments = await Appointment.find(filter)
    .populate('doctor', 'fullName')
    .populate('patient', 'fullName')
    .sort({ appointmentDate: req.query.type === 'upcoming' ? 1 : -1 });

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: {
      appointments,
    },
  });
});

// Get single appointment
export const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('doctor', 'name specialization')
    .populate('patient', 'name');

  if (!appointment) {
    return next(new ApiError('No appointment found with that ID', 404));
  }

  // Check if user has permission to view this appointment
  if (
    req.user.role !== 'admin' &&
    appointment.patient.toString() !== req.user._id.toString() &&
    appointment.doctor.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError('You do not have permission to view this appointment', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      appointment,
    },
  });
});

// Cancel appointment
export const cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new ApiError('No appointment found with that ID', 404));
  }

  // Check if user has permission to cancel this appointment
  if (
    (req.user.role !== 'admin' &&
      appointment.patient.toString() !== req.user._id.toString()) ||
    appointment.doctor.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError('You do not have permission to cancel this appointment', 403)
    );
  }

  appointment.status = 'cancelled';
  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment,
    },
  });
});

// Get doctor's available time slots
export const getDoctorAvailability = asyncHandler(async (req, res, next) => {
  const { doctorId, date } = req.query;

  // Get all appointments for the doctor on the specified date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: { $ne: 'cancelled' },
  }).select('appointmentDate');

  // Return the booked time slots
  res.status(200).json({
    status: 'success',
    data: {
      bookedSlots: bookedAppointments.map(app => app.appointmentDate),
    },
  });
});

// Confirm appointment (Doctor only)
export const confirmAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new ApiError('No appointment found with that ID', 404));
  }

  // Check if user is the doctor for this appointment
  if (
    req.user.role !== 'doctor' ||
    appointment.doctor.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError('Only the assigned doctor can confirm this appointment', 403)
    );
  }

  // Check if appointment is already confirmed or completed
  if (appointment.status !== 'pending') {
    return next(
      new ApiError(`Appointment is already ${appointment.status}`, 400)
    );
  }

  appointment.status = 'confirmed';
  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

// Complete appointment and add medical notes (Doctor only)
export const completeAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new ApiError('No appointment found with that ID', 404));
  }

  // Check if user is the doctor for this appointment
  if (
    req.user.role !== 'doctor' ||
    appointment.doctor.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError(
        'Only the assigned doctor can complete this appointment',
        403
      )
    );
  }

  // Check if appointment is confirmed
  if (appointment.status !== 'confirmed') {
    return next(
      new ApiError('Only confirmed appointments can be completed', 400)
    );
  }

  // Update appointment with medical notes and completion details
  const { diagnosis, symptoms, treatment, followUp } = req.body;

  // Update appointment status and medical notes
  appointment.status = 'completed';
  appointment.appointmentReport = {
    diagnosis,
    symptoms,
    treatment,
    followUp,
    completedAt: new Date(),
  };

  await appointment.save();

  // Create medical record
  const medicalRecord = await MedicalRecord.create({
    patient: appointment.patient,
    doctor: appointment.doctor,
    appointment: appointment._id,
    diagnosis,
    symptoms,
    treatment,
    followUp,
    attachments: appointment.uploadedFiles,
  });

  res.status(200).json({
    status: 'success',
    data: {
      appointment,
    },
  });
});
