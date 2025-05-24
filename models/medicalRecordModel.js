import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
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
    attachments: [
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
  {
    timestamps: true,
  }
);

export default mongoose.model('MedicalRecord', medicalRecordSchema);
