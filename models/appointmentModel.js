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
    //     'Follow-up',
    //     'Regular Check-up',
    //     'Emergency',
    //     'Lab Results Review',
    //     'Prescription Renewal',
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
    appointmentReport: {
      diagnosis: String,
      symptoms: [String],
      treatment: {
        medications: [
          {
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
          },
        ],
        recommendations: [String],
      },
      followUp: {
        required: {
          type: Boolean,
          default: false,
        },
        date: Date,
        notes: String,
      },
      completedAt: Date,
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
