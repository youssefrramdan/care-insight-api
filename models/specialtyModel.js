// models/specialtyModel.js
import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Specialty name is required'],
      trim: true,
      minlength: [3, 'Specialty name must be at least 3 characters'],
      maxlength: [50, 'Specialty name must be at most 50 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
  }
);
specialtySchema.index({ name: 1 });

// Create a virtual field for doctorsCount
specialtySchema.virtual('doctorsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'specialty',
  count: true,
});

const Specialty = mongoose.model('Specialty', specialtySchema);

export default Specialty;
