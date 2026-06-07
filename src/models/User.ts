import mongoose, { Schema, Document, Model } from 'mongoose';
import { getModel } from '../lib/db';

export interface IUser {
  _id?: string;
  clerkId: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  persistenceScore: number;
  stats: {
    attemptsCount: number;
    rejectionsCount: number;
    lessonsCount: number;
    peopleHelped: number;
    storiesPublished: number;
  };
  achievements: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    persistenceScore: { type: Number, default: 0 },
    stats: {
      attemptsCount: { type: Number, default: 0 },
      rejectionsCount: { type: Number, default: 0 },
      lessonsCount: { type: Number, default: 0 },
      peopleHelped: { type: Number, default: 0 },
      storiesPublished: { type: Number, default: 0 },
    },
    achievements: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Fallback mechanism to ensure we don't compile model multiple times
const mongooseModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export const User = getModel<IUser>('User', mongooseModel);
