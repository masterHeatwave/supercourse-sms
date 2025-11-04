// src/components/messaging/models/chat.model.ts
import mongoose, { Schema, Model } from 'mongoose';
import toJson from '../../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { activityTrackerPlugin } from '@plugins/activityTracker';
import { ActivityEntityType } from '@components/activity/activity.interface';
import {
  IChat,
  IChatModel,
  ChatType,
  IUserChatSettings,
} from '../messaging.interface';

// Type for the complete model (Document + Statics)
type ChatModel = Model<IChat> & IChatModel;

const ChatSchema: Schema<IChat> = new mongoose.Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageContent: {
      type: String,
      default: '',
    },
    lastMessagedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    type: {
      type: String,
      enum: Object.values(ChatType),
      default: ChatType.DIRECT,
    },
    name: {
      type: String,
      default: '',
    },
    // ✅ Simple global settings - no per-user complexity
    isStarred: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ❌ REMOVE all getUserSettings and updateUserSettings methods
// Keep the schema simple

// ==================== INDEXES ====================
ChatSchema.index({ participants: 1, type: 1 });
ChatSchema.index({ lastMessagedAt: -1 });
ChatSchema.index({ 'participants': 1, 'lastMessagedAt': -1 });

// ==================== VIRTUALS ====================

/**
 * Virtual for compatibility with frontend (lastMessage)
 */
ChatSchema.virtual('lastMessage').get(function () {
  return this.lastMessageContent;
});

// ==================== STATIC METHODS ====================

/**
 * Find chats by participant
 * @param userId - User ID to search for
 */
ChatSchema.statics.findByParticipant = function (
  userId: string | mongoose.Types.ObjectId
): Promise<IChat[]> {
  return this.find({ participants: userId })
    .sort({ lastMessagedAt: -1 })
    .populate('participants', 'firstname lastname email avatar username isOnline lastSeen')
    .populate('lastMessageId')
    .exec();
};

/**
 * Find direct chat between two users
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 */
ChatSchema.statics.findDirectChat = async function (
  user1Id: string | mongoose.Types.ObjectId,
  user2Id: string | mongoose.Types.ObjectId
): Promise<IChat | null> {
  const participants = [user1Id, user2Id];
  
  return await this.findOne({
    type: ChatType.DIRECT,
    participants: { $all: participants },
    $expr: { $eq: [{ $size: '$participants' }, participants.length] },
  })
    .populate('participants', 'firstname lastname email avatar username isOnline lastSeen')
    .exec();
};

/**
 * Reset unread count for a user
 */
ChatSchema.methods.resetUnreadCountForUser = function (userId: string): void {
  const userIdStr = userId.toString();
  
  if (!this.unreadCount) {
    this.unreadCount = new Map();
  }
  
  this.unreadCount.set(userIdStr, 0);
  this.markModified('unreadCount');
};

/**
 * Increment unread count for users (except sender)
 */
ChatSchema.methods.incrementUnreadCount = function (senderId: string): void {
  const senderIdStr = senderId.toString();
  
  if (!this.unreadCount) {
    this.unreadCount = new Map();
  }
  
  // Get unique participants
  const uniqueParticipants = [...new Set(this.participants.map((p: mongoose.Types.ObjectId) => p.toString()))];
  
  uniqueParticipants.forEach((participantIdStr) => {
    if (participantIdStr !== senderIdStr) {
      const currentCount = this.unreadCount.get(participantIdStr) || 0;
      this.unreadCount.set(participantIdStr, currentCount + 1);
    } else {
      // Ensure sender has 0 unread count
      if (!this.unreadCount.has(participantIdStr)) {
        this.unreadCount.set(participantIdStr, 0);
      }
    }
  });
  
  this.markModified('unreadCount');
};

// ==================== MIDDLEWARE ====================

/**
 * Pre-save hook: Initialize unread counts for new chats
 */
ChatSchema.pre('save', function (next) {
  if (this.isNew) {
    if (!this.unreadCount) {
      this.unreadCount = new Map();
    }
    
    // Initialize unread count for all participants
    this.participants.forEach((participantId) => {
      const participantIdStr = participantId.toString();
      if (!this.unreadCount.has(participantIdStr)) {
        this.unreadCount.set(participantIdStr, 0);
      }
    });
    
    this.markModified('unreadCount');
  }
  
  next();
});

// ==================== PLUGINS ====================
ChatSchema.plugin(toJson);
ChatSchema.plugin(advancedResultsPlugin);
ChatSchema.plugin(tenantAwarePlugin);

// Apply activity tracker plugin for chat actions
ChatSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.CHAT,
  entityNameField: 'name',
  getActivityDetails: (doc: IChat, isNew: boolean) => {
    if (isNew) {
      return `Created ${doc.type} chat${doc.name ? `: ${doc.name}` : ''}`;
    }
    return `Updated chat${doc.name ? `: ${doc.name}` : ''}`;
  },
});

// ==================== EXPORT ====================
const Chat = mongoose.model<IChat, ChatModel & IAdvancedResultsModel<IChat>>(
  'Chat',
  ChatSchema
);

export default Chat;
export { ChatSchema };