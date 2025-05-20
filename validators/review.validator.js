import { check } from 'express-validator';
import validatorMiddleware from '../middlewares/validatorMiddleware.js';

export const createReviewValidator = [
  check('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID format'),

  check('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  check('comment')
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 10 })
    .withMessage('Review comment must be at least 10 characters long'),

  validatorMiddleware,
];

export const updateReviewValidator = [
  check('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  check('comment')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Review comment must be at least 10 characters long'),

  validatorMiddleware,
];
