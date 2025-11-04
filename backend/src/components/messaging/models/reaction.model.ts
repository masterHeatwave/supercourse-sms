// src/components/messaging/models/reaction.model.ts
import mongoose, { Schema } from 'mongoose';
import toJson from '../../../plugins/toJson';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { IReaction } from '../messaging.interface';

/**
 * Reaction Schema
 * ✅ FIXED: Following Taxi pattern
 */
const ReactionSchema: Schema<IReaction> = new mongoose.Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    emoji: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
ReactionSchema.index({ messageId: 1, userId: 1, emoji: 1 }, { unique: true });

// ==================== PLUGINS ====================
ReactionSchema.plugin(toJson);
ReactionSchema.plugin(tenantAwarePlugin);

// ==================== EXPORT ====================
const Reaction = mongoose.model<IReaction>('Reaction', ReactionSchema);

export default Reaction;
export { ReactionSchema };