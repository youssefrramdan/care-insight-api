import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';

// Create new review
export const createReview = asyncHandler(async (req, res, next) => {
  const { doctorId, rating, comment } = req.body;

  // Check if doctor exists and is actually a doctor
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    return next(new ApiError('Doctor not found', 404));
  }

  // Check if patient has already reviewed this doctor
  const existingReview = await Review.findOne({
    doctor: doctorId,
    patient: req.user._id,
  });

  if (existingReview) {
    return next(
      new ApiError('You have already submitted a review for this doctor', 400)
    );
  }

  // Create the review
  const review = await Review.create({
    doctor: doctorId,
    patient: req.user._id,
    rating,
    comment,
  });

  // Add review to doctor's reviews array
  await User.findByIdAndUpdate(doctorId, {
    $push: { reviews: review._id },
  });

  // Populate patient info in the response
  await review.populate('patient', 'fullName profileImage');

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

// Get all reviews for a doctor
export const getDoctorReviews = asyncHandler(async (req, res, next) => {
  const { doctorId } = req.params;

  // Check if doctor exists
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' }).populate(
    {
      path: 'reviews',
      populate: {
        path: 'patient',
        select: 'fullName profileImage',
      },
    }
  );

  if (!doctor) {
    return next(new ApiError('Doctor not found', 404));
  }

  res.status(200).json({
    status: 'success',
    results: doctor.reviews.length,
    data: {
      reviews: doctor.reviews,
    },
  });
});

// Update review
export const updateReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;
  const { reviewId } = req.params;

  const review = await Review.findOne({
    _id: reviewId,
    patient: req.user._id,
  });

  if (!review) {
    return next(new ApiError('Review not found or not authorized', 404));
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  await review.save();

  // Populate patient info in the response
  await review.populate('patient', 'fullName profileImage');

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

// Delete review
export const deleteReview = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findOne({
    _id: reviewId,
    patient: req.user._id,
  });

  if (!review) {
    return next(new ApiError('Review not found or not authorized', 404));
  }

  // Remove review from doctor's reviews array
  await User.findByIdAndUpdate(review.doctor, {
    $pull: { reviews: reviewId },
  });

  await review.deleteOne();
  res.status(204).json({
    status: 'success',
  });
});
