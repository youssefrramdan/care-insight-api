import express from 'express';
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  uploadAppointmentFiles,
} from '../controllers/appointmentController.js';
import { protectedRoutes } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const router = express.Router();
const upload = createUploader('files');
// Protect all routes
router.use(protectedRoutes);

// Public routes (after authentication)
router.route('/').post(createAppointment).get(getAllAppointments);

router.route('/:id').get(getAppointmentById).patch(updateAppointment);

router.patch('/:id/cancel', cancelAppointment);

// File upload routes
router.post(
  '/:appointmentId/upload',
  upload.array('files', 5),
  uploadAppointmentFiles
);

export default router;
