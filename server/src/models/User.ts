import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUserProfile {
  displayName: string;
  dateOfBirth?: Date;
  sex: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  goal: 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface IUserPreferences {
  dietaryPreference: 'omnivore' | 'vegetarian' | 'vegan' | 'other';
  restrictions: string[];
  excludedFoods: string[];
  equipment: string[];
  workoutDurationMin: number;
  mealsPerDay: number;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  status: 'active' | 'disabled';
  profile: IUserProfile;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Exclude by default in queries for security
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    profile: {
      displayName: { type: String, default: '', trim: true },
      dateOfBirth: { type: Date },
      sex: {
        type: String,
        enum: ['female', 'male', 'other', 'prefer_not_to_say'],
        default: 'prefer_not_to_say',
      },
      heightCm: { type: Number, default: 170, min: 50, max: 280 },
      weightKg: { type: Number, default: 65, min: 20, max: 400 },
      goal: {
        type: String,
        enum: ['maintain', 'lose_weight', 'gain_weight', 'improve_fitness'],
        default: 'maintain',
      },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'high'],
        default: 'moderate',
      },
      fitnessLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
      },
    },
    preferences: {
      dietaryPreference: {
        type: String,
        enum: ['omnivore', 'vegetarian', 'vegan', 'other'],
        default: 'omnivore',
      },
      restrictions: { type: [String], default: [] },
      excludedFoods: { type: [String], default: [] },
      equipment: { type: [String], default: [] },
      workoutDurationMin: { type: Number, default: 30, min: 5, max: 180 },
      mealsPerDay: { type: Number, default: 3, min: 1, max: 8 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
