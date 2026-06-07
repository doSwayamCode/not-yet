import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../lib/db';

export interface ICounterMetrics {
  _id?: string;
  key: string; // e.g. "global_counter"
  applicationsRejected: number;
  interviewsFailed: number;
  hackathonsLost: number;
  startupsClosed: number;
  projectsAbandoned: number;
  lessonsShared: number;
  peopleHelped: number;
  storiesPublished: number;
}

export interface ICounterMetricsDocument extends Omit<ICounterMetrics, '_id'>, Document {}

const CounterMetricsSchema = new Schema<ICounterMetricsDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'global_counter' },
    applicationsRejected: { type: Number, default: 0 },
    interviewsFailed: { type: Number, default: 0 },
    hackathonsLost: { type: Number, default: 0 },
    startupsClosed: { type: Number, default: 0 },
    projectsAbandoned: { type: Number, default: 0 },
    lessonsShared: { type: Number, default: 0 },
    peopleHelped: { type: Number, default: 0 },
    storiesPublished: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const mongooseModel = mongoose.models.CounterMetrics || mongoose.model<ICounterMetricsDocument>('CounterMetrics', CounterMetricsSchema);

export const CounterMetrics = getModel<ICounterMetrics>('CounterMetrics', mongooseModel);
