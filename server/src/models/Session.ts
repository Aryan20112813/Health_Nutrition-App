import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: Types.ObjectId | null;
  userAgentHash: string | null;
  createdIpHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '30d' }, // MongoDB TTL auto-cleanup after expiry window
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedBySessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    userAgentHash: {
      type: String,
      default: null,
    },
    createdIpHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for active session lookups
SessionSchema.index({ userId: 1, expiresAt: 1 });

export const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) || mongoose.model<ISession>('Session', SessionSchema);
