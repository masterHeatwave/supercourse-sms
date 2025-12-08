import mongoose, { Schema } from 'mongoose';
import toJson from '../../plugins/toJson';

export interface IPostVote extends mongoose.Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  optionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PostVoteSchema: Schema<IPostVote> = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Please add a post ID'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add a user ID'],
    },
    optionIds: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create unique index to prevent duplicate votes from same user on same post
PostVoteSchema.index({ post: 1, user: 1 }, { unique: true });

PostVoteSchema.plugin(toJson);

export default mongoose.model<IPostVote>('PostVote', PostVoteSchema);
