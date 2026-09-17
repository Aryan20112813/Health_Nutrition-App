import mongoose, { Schema, Document } from 'mongoose';

export interface IExercisePrescription {
  sets: number | null;
  reps: string | null;
  durationSec: number | null;
  restSec: number | null;
}

export interface IExercise extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  muscleGroups: string[];
  goalTags: string[];
  fitnessLevels: string[];
  equipment: string[];
  movementPattern: string;
  instructions: string[];
  safetyNotes: string[];
  defaultPrescription: IExercisePrescription;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exercisePrescriptionSchema = new Schema<IExercisePrescription>(
  {
    sets: { type: Number, default: null },
    reps: { type: String, default: null },
    durationSec: { type: Number, default: null },
    restSec: { type: Number, default: null },
  },
  { _id: false }
);

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    muscleGroups: [{ type: String }],
    goalTags: [{ type: String }],
    fitnessLevels: [{ type: String }],
    equipment: [{ type: String }],
    movementPattern: { type: String, default: 'general' },
    instructions: [{ type: String }],
    safetyNotes: [{ type: String }],
    defaultPrescription: { type: exercisePrescriptionSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes as per Schema.md section 9
exerciseSchema.index({ isActive: 1, goalTags: 1, fitnessLevels: 1 });

export const Exercise = mongoose.model<IExercise>('Exercise', exerciseSchema);
