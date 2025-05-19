/* eslint-disable import/no-extraneous-dependencies */
import { matchedData, validationResult } from 'express-validator';

/**
 * @desc    Middleware for validating requests
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next middleware function
 * @returns {void}
 */
const validatorMiddleware = (req, res, next) => {
  // Find the validation errors from the request
  const errors = validationResult(req);

  // If there are validation errors, return a 400 Bad Request with errors
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }

  // If no validation errors, proceed to the next middleware
  req.validData = matchedData(req);
  next();
};

export default validatorMiddleware;

// matchedData(req) is a function in express-validator
// that extracts only the validated and sanitized data from the request (req).
//  It ensures that only valid and expected data is processed,
//  preventing unwanted or malicious data from being used in your application.
// 🚀 How matchedData(req) Works Step by Step
// User sends an HTTP request containing data (req.body, req.params, or req.query).
// express-validator validates the data based on defined rules (check(), param()).
// validationResult(req) collects errors (if any).
// matchedData(req) extracts only the validated fields, filtering out any extra, in valid, or unexpected data.
