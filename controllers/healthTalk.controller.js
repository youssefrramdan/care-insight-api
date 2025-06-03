import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import HealthTalk from '../models/healthTalkModel.js';

// @desc    Create new health talk
// @route   POST /api/v1/health-talks
// @access  Private (Doctors only)
const createHealthTalk = asyncHandler(async (req, res, next) => {
  const { title, content, category, tags } = req.body;
  console.log(req.file);

  const healthTalk = await HealthTalk.create({
    title,
    content,
    category,
    tags,
    author: req.user._id,
    image: req.file ? req.file.path : null,
  });

  res.status(201).json({
    status: 'success',
    data: healthTalk,
  });
});

// @desc    Get all health talks
// @route   GET /api/v1/health-talks
// @access  Public
const getAllHealthTalks = asyncHandler(async (req, res, next) => {
  const filter = {};

  // Search functionality
  if (req.query.keyword) {
    filter.$or = [
      { title: { $regex: req.query.keyword, $options: 'i' } },
      { content: { $regex: req.query.keyword, $options: 'i' } },
      { tags: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }

  // Filter by category
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Filter by tags
  if (req.query.tags) {
    filter.tags = { $in: req.query.tags.split(',') };
  }

  // Filter by author (doctor)
  if (req.query.author) {
    filter.author = req.query.author;
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const healthTalks = await HealthTalk.find(filter)
    .populate('author', 'name specialty photo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await HealthTalk.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: healthTalks.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      limit,
    },
    data: healthTalks,
  });
});

// @desc    Get single health talk
// @route   GET /api/v1/health-talks/:id
// @access  Public
const getHealthTalkById = asyncHandler(async (req, res, next) => {
  const healthTalk = await HealthTalk.findById(req.params.id)
    .populate('author', 'name specialty photo')
    .populate('comments.user', 'name photo');

  if (!healthTalk) {
    return next(new ApiError('No health talk found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: healthTalk,
  });
});

// @desc    Update health talk
// @route   PATCH /api/v1/health-talks/:id
// @access  Private (Author only)
const updateHealthTalk = asyncHandler(async (req, res, next) => {
  const healthTalk = await HealthTalk.findById(req.params.id);

  if (!healthTalk) {
    return next(new ApiError('No health talk found with that ID', 404));
  }

  // Check if user is the author
  if (healthTalk.author.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You do not have permission to update this health talk', 403)
    );
  }

  const updatedHealthTalk = await HealthTalk.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: updatedHealthTalk,
  });
});

// @desc    Delete health talk
// @route   DELETE /api/v1/health-talks/:id
// @access  Private (Author only)
const deleteHealthTalk = asyncHandler(async (req, res, next) => {
  const healthTalk = await HealthTalk.findById(req.params.id);

  if (!healthTalk) {
    return next(new ApiError('No health talk found with that ID', 404));
  }

  // Check if user is the author
  if (healthTalk.author.toString() !== req.user._id.toString()) {
    return next(
      new ApiError('You do not have permission to delete this health talk', 403)
    );
  }

  await healthTalk.remove();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Add comment to health talk
// @route   POST /api/v1/health-talks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res, next) => {
  const healthTalk = await HealthTalk.findById(req.params.id);

  if (!healthTalk) {
    return next(new ApiError('No health talk found with that ID', 404));
  }

  const newComment = {
    user: req.user._id,
    text: req.body.text,
  };

  healthTalk.comments.push(newComment);
  await healthTalk.save();

  res.status(201).json({
    status: 'success',
    data: healthTalk,
  });
});

// @desc    Toggle like on health talk
// @route   POST /api/v1/health-talks/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res, next) => {
  const healthTalk = await HealthTalk.findById(req.params.id);

  if (!healthTalk) {
    return next(new ApiError('No health talk found with that ID', 404));
  }

  const userIndex = healthTalk.likes.indexOf(req.user._id);

  if (userIndex === -1) {
    // User hasn't liked the post yet - add like
    healthTalk.likes.push(req.user._id);
  } else {
    // User has already liked - remove like
    healthTalk.likes.splice(userIndex, 1);
  }

  await healthTalk.save();

  res.status(200).json({
    status: 'success',
    data: healthTalk,
  });
});

export {
  createHealthTalk,
  getAllHealthTalks,
  getHealthTalkById,
  updateHealthTalk,
  deleteHealthTalk,
  addComment,
  toggleLike,
};
