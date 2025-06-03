import mongoose from 'mongoose';

const healthTalkSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A health talk must have an author'],
  },
  title: {
    type: String,
    required: [true, 'A health talk must have a title'],
    trim: true,
    maxLength: [100, 'Title must be less than 100 characters'],
  },
  content: {
    type: String,
    required: [true, 'A health talk must have content'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Articles', 'Case Studies', 'Research'],
    required: [true, 'A health talk must have a category'],
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      text: {
        type: String,
        required: true,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  image: {
    type: String,
    default: null,
  },
});

// Populate author details when querying
healthTalkSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'fullName',
    populate: {
      path: 'specialty',
      select: 'name',
    },
  }).populate({
    path: 'comments.user',
    select: 'fullName profileImage',
  });
  next();
});

const HealthTalk = mongoose.model('HealthTalk', healthTalkSchema);

export default HealthTalk;
