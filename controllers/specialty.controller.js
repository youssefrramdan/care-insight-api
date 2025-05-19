import asyncHandler from 'express-async-handler';
import Specialty from '../models/specialtyModel.js';
import ApiError from '../utils/apiError.js';

/**
 * @desc    Create new Specialty
 * @route   POST /api/v1/specialties
 * @access  Private/Admin
 */
const createSpecialty = asyncHandler(async (req, res, next) => {
  if (req.file) {
    req.body.imageCover = req.file.path;
  }
  const specialty = await Specialty.create(req.body);

  res.status(201).json({
    message: 'success',
    data: specialty,
  });
});

/**
 * @desc    Update specific Specialty
 * @route   PUT /api/v1/specialties/:id
 * @access  Private/Admin
 */
const updateSpecialty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (req.file) {
    req.body.imageCover = req.file.path;
  }
  const specialty = await Specialty.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!specialty) {
    return next(
      new ApiError(`There isn't a specialty for this ID: ${id}`, 404)
    );
  }
  res.status(200).json({
    message: 'success',
    data: specialty,
  });
});

/**
 * @desc    Delete specific Specialty
 * @route   DELETE /api/v1/specialties/:id
 * @access  Private/Admin
 */
const deleteSpecialty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const specialty = await Specialty.findByIdAndDelete(id);

  if (!specialty) {
    return next(
      new ApiError(`There isn't a specialty for this ID: ${id}`, 404)
    );
  }
  res.status(200).json({
    message: 'success',
  });
});

/**
 * @desc    Get all specialties
 * @route   GET /api/v1/specialties
 * @access  Public
 */
const getAllSpecialties = asyncHandler(async (req, res, next) => {
  const specialties = await Specialty.find()
    .populate({ path: 'doctorsCount' })
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    message: 'success',
    data: specialties,
  });
});

/**
 * @desc    Get specific Specialty
 * @route   GET /api/v1/specialties/:id
 * @access  Public
 */
const getSpecificSpecialty = asyncHandler(async (req, res, next) => {
  const specialty = await Specialty.findById(req.params.id).select(
    '-__v -createdAt -updatedAt'
  );

  if (!specialty) {
    return next(
      new ApiError(`There isn't a specialty for this ID: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    message: 'success',
    data: specialty,
  });
});

export {
  getAllSpecialties,
  getSpecificSpecialty,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
};
