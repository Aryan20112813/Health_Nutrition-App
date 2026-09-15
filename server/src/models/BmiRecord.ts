import mongoose, { Document, Schema, Model } from 'mongoose';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obesity';

export interface IBmiRecord extends Document {
  userId: mongoose.Types.ObjectId;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: BmiCategory;
  recordedAt: Date;
  createdAt: Date;
}

const BmiRecordSchema = new Schema<IBmiRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    heightCm: {
      type: Number,
      required: true,
      min: [50, 'Height must be at least 50 cm'],
      max: [280, 'Height must be under 280 cm'],
    },
    weightKg: {
      type: Number,
      required: true,
      min: [20, 'Weight must be at least 20 kg'],
      max: [400, 'Weight must be under 400 kg'],
    },
    bmi: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['underweight', 'normal', 'overweight', 'obesity'],
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for user records sorted by date descending as per Schema.md
BmiRecordSchema.index({ userId: 1, recordedAt: -1 });

export const BmiRecord: Model<IBmiRecord> =
  mongoose.models.BmiRecord || mongoose.model<IBmiRecord>('BmiRecord', BmiRecordSchema);
