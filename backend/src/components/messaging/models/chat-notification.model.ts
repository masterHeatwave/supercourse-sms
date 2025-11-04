// src/components/messaging/models/chat-notification.model.ts
import mongoose, { Schema, Model } from 'mongoose';
import toJson from '../../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { activityTrackerPlugin } from '@plugins/activityTracker';
import { ActivityEntityType } from '@components/activity/activity.interface';
import {
  IChatNotification,
  IChatNotificationModel,
  NotificationType,
} from '../messaging.interface';

// Type for the complete model (Document + Statics)
type ChatNotificationModel = Model<IChatNotification> & IChatNotificationModel;

/**
 * Chat Notification Schema
 * ✅ FIXED: Use Taxi pattern - only one generic
 */
const ChatNotificationSchema: Schema<IChatNotification> = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    relatedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    relatedMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    relatedChatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
ChatNotificationSchema.index({ userId: 1, createdAt: -1 });
ChatNotificationSchema.index({ userId: 1, isRead: 1, isDeleted: 1 });
ChatNotificationSchema.index({ userId: 1, type: 1 });

// ==================== VIRTUALS ====================

/**
 * Virtual to populate related user info
 */
ChatNotificationSchema.virtual('relatedUser', {
  ref: 'User',
  localField: 'relatedUserId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual to populate related message info
 */
ChatNotificationSchema.virtual('relatedMessage', {
  ref: 'Message',
  localField: 'relatedMessageId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual to populate related chat info
 */
ChatNotificationSchema.virtual('relatedChat', {
  ref: 'Chat',
  localField: 'relatedChatId',
  foreignField: '_id',
  justOne: true,
});

// ==================== STATIC METHODS ====================

/**
 * Find notifications by user ID
 * @param userId - User ID to search for
 * @param limit - Maximum number of results (default: 20)
 */
ChatNotificationSchema.statics.findByUserId = function (
  userId: string | mongoose.Types.ObjectId,
  limit: number = 20
): Promise<IChatNotification[]> {
  return this.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('relatedUserId', 'username avatar firstname lastname')
    .populate('relatedChatId', 'name type')
    .exec();
};

/**
 * Find unread notifications by user ID
 * @param userId - User ID to search for
 */
ChatNotificationSchema.statics.findUnreadByUserId = function (
  userId: string | mongoose.Types.ObjectId
): Promise<IChatNotification[]> {
  return this.find({ userId, isRead: false, isDeleted: false })
    .sort({ createdAt: -1 })
    .populate('relatedUserId', 'username avatar firstname lastname')
    .populate('relatedChatId', 'name type')
    .exec();
};

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 */
ChatNotificationSchema.statics.markAsRead = async function (
  notificationId: string | mongoose.Types.ObjectId
): Promise<IChatNotification | null> {
  return await this.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  ).populate('relatedUserId', 'username avatar firstname lastname');
};

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 */
ChatNotificationSchema.statics.markAllAsRead = async function (
  userId: string | mongoose.Types.ObjectId
): Promise<number> {
  const result = await this.updateMany(
    { userId, isRead: false, isDeleted: false },
    { isRead: true, readAt: new Date() }
  );

  return result.modifiedCount || 0;
};

// ==================== PLUGINS ====================
ChatNotificationSchema.plugin(toJson);
ChatNotificationSchema.plugin(advancedResultsPlugin);
ChatNotificationSchema.plugin(tenantAwarePlugin);

// Apply activity tracker plugin for notification actions
ChatNotificationSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.CHAT_NOTIFICATION,
  entityNameField: 'title',
  getActivityDetails: (doc: IChatNotification, isNew: boolean) => {
    if (isNew) {
      return `Created ${doc.type} notification: ${doc.title}`;
    }
    return `Updated notification: ${doc.title}`;
  },
});

// ==================== EXPORT ====================
const ChatNotification = mongoose.model 
<IChatNotification,
  ChatNotificationModel & IAdvancedResultsModel<IChatNotification>
>('ChatNotification', ChatNotificationSchema);

export default ChatNotification;
export { ChatNotificationSchema };