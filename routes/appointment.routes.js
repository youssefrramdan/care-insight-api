import express from 'express';
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  uploadAppointmentFiles,
  getDoctorAvailability,
  confirmAppointment,
  completeAppointment,
} from '../controllers/appointmentController.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const router = express.Router();
const upload = createUploader('files');

// Protect all routes
router.use(protectedRoutes);

// Public routes (after authentication)
router
  .route('/')
  .post(allowTo('patient'), createAppointment)
  .get(getAllAppointments);

// Get specific appointment
router.get('/:id', getAppointmentById);

// Doctor's available slots
router.get('/available-slots/:doctorId', getDoctorAvailability);

// Appointment status changes
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/confirm', allowTo('doctor'), confirmAppointment);
router.patch('/:id/complete', allowTo('doctor'), completeAppointment);

// File upload routes
router.post(
  '/:appointmentId/upload',
  upload.array('files', 5),
  uploadAppointmentFiles
);

export default router;
