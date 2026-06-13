import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../lib/db';

export interface ITimelineEvent {
  date: string;
  title: string;
  description: string;
  status: 'fail' | 'success' | 'milestone' | 'pending';
}

export interface IJourney {
  _id?: string;
  userId: string; // References User clerkId or username
  author: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isAnonymous: boolean;
    nickname?: string;
  };
  title: string;
  goal: string;
  category: string;
  tags: string[];
  timeline: ITimelineEvent[];
  whatHappened: string;
  lowestPoint: string;
  biggestMistake: string;
  whatChanged: string;
  whatLearned: string;
  advice: string;
  currentStatus: string;
  reflection: string;
  readingTime: number;
  visibility: 'public' | 'anonymous' | 'nickname';
  linkedinProfileUrl?: string;
  isPublished: boolean;
  status: 'active' | 'flagged' | 'archived';
  reactions: {
    relatable: number;
    beenThere: number;
    learnedSomething: number;
    inspiredMe: number;
    neededThis: number;
    respect: number;
  };
  commentsCount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IJourneyDocument extends Omit<IJourney, '_id'>, Document {}

const TimelineEventSchema = new Schema<ITimelineEvent>({
  date: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['fail', 'success', 'milestone', 'pending'], required: true },
});

const JourneySchema = new Schema<IJourneyDocument>(
  {
    userId: { type: String, required: true },
    author: {
      displayName: { type: String, required: true },
      username: { type: String, required: true },
      avatarUrl: { type: String, default: '' },
      isAnonymous: { type: Boolean, default: false },
      nickname: { type: String },
    },
    title: { type: String, required: true },
    goal: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    timeline: { type: [TimelineEventSchema], default: [] },
    whatHappened: { type: String, required: true },
    lowestPoint: { type: String, required: true },
    biggestMistake: { type: String, required: true },
    whatChanged: { type: String, required: true },
    whatLearned: { type: String, required: true },
    advice: { type: String, required: true },
    currentStatus: { type: String, required: true },
    reflection: { type: String, required: true },
    readingTime: { type: Number, default: 1 },
    visibility: { type: String, enum: ['public', 'anonymous', 'nickname'], default: 'public' },
    linkedinProfileUrl: { type: String },
    isPublished: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'flagged', 'archived'], default: 'active' },
    reactions: {
      relatable: { type: Number, default: 0 },
      beenThere: { type: Number, default: 0 },
      learnedSomething: { type: Number, default: 0 },
      inspiredMe: { type: Number, default: 0 },
      neededThis: { type: Number, default: 0 },
      respect: { type: Number, default: 0 },
    },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Add index for search capability
JourneySchema.index({ title: 'text', goal: 'text', whatHappened: 'text', tags: 'text' });

const mongooseModel = mongoose.models.Journey || mongoose.model<IJourneyDocument>('Journey', JourneySchema);

export const Journey = getModel<IJourney>('Journey', mongooseModel);
