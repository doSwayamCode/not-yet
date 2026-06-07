import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../lib/db';

export interface IActivityLog {
  _id?: string;
  userId?: string;
  username?: string;
  action: string; // e.g. 'USER_LOGIN', 'JOURNEY_CREATE', 'COMMENT_FLAG', etc.
  details: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'danger';
  createdAt?: Date | string;
}

export interface IActivityLogDocument extends Omit<IActivityLog, '_id'>, Document {}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    userId: { type: String, index: true },
    username: { type: String },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
    severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
  },
  { timestamps: true }
);

const mongooseModel = mongoose.models.ActivityLog || mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

export const ActivityLog = getModel<IActivityLog>('ActivityLog', mongooseModel);
