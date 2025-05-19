import express from 'express';
import {
  register,
  registerDoctor,
  login,
  confirmEmail,
  forgetPassword,
  verifyResetCode,
  resetPassword,
  logout,
  protectedRoutes,
} from '../controllers/auth.controller.js';

import {
  registerPatientValidator,
  registerDoctorValidator,
  loginValidator,
  forgetPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
} from '../validators/user.validator.js';

const router = express.Router();

// Public routes
router.post('/register', registerPatientValidator, register);
router.post('/registerDoctor', registerDoctorValidator, registerDoctor);
router.post('/login', loginValidator, login);
router.get('/verify/:token', confirmEmail);
router.post('/forgot-password', forgetPasswordValidator, forgetPassword);
router.post('/verify-reset-code', verifyResetCodeValidator, verifyResetCode);
router.post('/reset-password', resetPasswordValidator, resetPassword);

// Protected routes
router.use(protectedRoutes);
router.post('/logout', logout);

export default router;
