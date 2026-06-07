import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../lib/db';

export interface IComment {
  _id?: string;
  journeyId: string;
  userId: string;
  author: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isAnonymous: boolean;
    nickname?: string;
  };
  content: string;
  parentId: string | null; // For threaded comments
  isPinned: boolean;
  isFlagged: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICommentDocument extends Omit<IComment, '_id'>, Document {}

const CommentSchema = new Schema<ICommentDocument>(
  {
    journeyId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    author: {
      displayName: { type: String, required: true },
      username: { type: String, required: true },
      avatarUrl: { type: String, default: '' },
      isAnonymous: { type: Boolean, default: false },
      nickname: { type: String },
    },
    content: { type: String, required: true },
    parentId: { type: String, default: null, index: true },
    isPinned: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const mongooseModel = mongoose.models.Comment || mongoose.model<ICommentDocument>('Comment', CommentSchema);

export const Comment = getModel<IComment>('Comment', mongooseModel);
