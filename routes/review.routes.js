import express from 'express';
import {
  createReview,
  getDoctorReviews,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import {
  createReviewValidator,
  updateReviewValidator,
} from '../validators/review.validator.js';
import { allowTo, protectedRoutes } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.get('/doctor/:doctorId', getDoctorReviews);

// Protected routes (patient only)
router.use(protectedRoutes);
router.use(allowTo('patient'));

router.post('/', createReviewValidator, createReview);
router.patch('/:reviewId', updateReviewValidator, updateReview);
router.delete('/:reviewId', deleteReview);

export default router;
