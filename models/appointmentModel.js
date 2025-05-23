import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    reasonForVisit: {
      type: String,
      required: true,
    //   enum: [
    //     'Initial Consultation',
    //     'Follow-up Appointment',
    //     'Review Test Results',
    //     'Discuss Treatment Plan',
    //     'Other',
    //   ],
    },
    notes: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    uploadedFiles: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
