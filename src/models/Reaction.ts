import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../lib/db';

export interface IReaction {
  _id?: string;
  journeyId: string;
  userId: string; // References User clerkId or username
  type: 'relatable' | 'beenThere' | 'learnedSomething' | 'inspiredMe' | 'neededThis' | 'respect';
  createdAt?: Date | string;
}

export interface IReactionDocument extends Omit<IReaction, '_id'>, Document {}

const ReactionSchema = new Schema<IReactionDocument>(
  {
    journeyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['relatable', 'beenThere', 'learnedSomething', 'inspiredMe', 'neededThis', 'respect'],
      required: true,
    },
  },
  { timestamps: true }
);

// Create compound index for unique reaction per user per type per journey
ReactionSchema.index({ journeyId: 1, userId: 1, type: 1 }, { unique: true });

const mongooseModel = mongoose.models.Reaction || mongoose.model<IReactionDocument>('Reaction', ReactionSchema);

export const Reaction = getModel<IReaction>('Reaction', mongooseModel);
