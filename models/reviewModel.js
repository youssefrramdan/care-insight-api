import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a doctor'],
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a patient'],
    },
    rating: {
      type: Number,
      required: [true, 'Review must have a rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review must have a comment'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews from the same patient for the same doctor
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRating = async function (doctorId) {
  const stats = await this.aggregate([
    {
      $match: { doctor: doctorId },
    },
    {
      $group: {
        _id: '$doctor',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('User').findByIdAndUpdate(doctorId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      numberOfReviews: stats[0].numReviews,
    });
  } else {
    await mongoose.model('User').findByIdAndUpdate(doctorId, {
      averageRating: 0,
      numberOfReviews: 0,
    });
  }
};

// Call calcAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.doctor);
});

// Call calcAverageRating before remove
reviewSchema.pre('remove', function () {
  this.constructor.calcAverageRating(this.doctor);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
