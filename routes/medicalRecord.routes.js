import express from 'express';
import {
  getAllMedicalRecords,
  getPatientMedicalRecords,
  getMyMedicalRecords,
  getMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';

const medicalRecordRouter = express.Router();

// Protect all routes
medicalRecordRouter.use(protectedRoutes);

// Routes accessible by role
medicalRecordRouter.get('/', getAllMedicalRecords);
medicalRecordRouter.get('/my-records', protectedRoutes, getMyMedicalRecords);
medicalRecordRouter.get('/patient/:patientId', protectedRoutes, getPatientMedicalRecords);
medicalRecordRouter.get('/:id', protectedRoutes, getMedicalRecord);

export default medicalRecordRouter;
