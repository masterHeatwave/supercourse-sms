// src/components/messaging/models/message.model.ts
import mongoose, { Schema, Model } from 'mongoose';
import toJson from '../../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { activityTrackerPlugin } from '@plugins/activityTracker';
import { ActivityEntityType } from '@components/activity/activity.interface';
import {
  IMessage,
  IMessageModel,
  MessageType,
  IDeliveryStatus,
  IReadStatus,
} from '../messaging.interface';
import Chat from './chat.model';

// Type for the complete model (Document + Statics)
type MessageModel = Model<IMessage> & IMessageModel;

/**
 * Delivery Status Sub-Schema
 */
const DeliveryStatusSchema = new Schema<IDeliveryStatus>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Read Status Sub-Schema
 */
const ReadStatusSchema = new Schema<IReadStatus>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Message Schema
 */
const MessageSchema: Schema<IMessage> = new mongoose.Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: false,
    },
    attachments: [
      {
        fileId: {
          type: Schema.Types.ObjectId,
          ref: 'StorageFile',
        },
        filename: String,
        key: String,
        size: Number,
        contentType: String,
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    deliveredTo: [DeliveryStatusSchema],
    readBy: [ReadStatusSchema],
    // Legacy fields for backward compatibility
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
MessageSchema.index({ chatId: 1, timestamp: 1 });
MessageSchema.index({ senderId: 1, timestamp: 1 });
MessageSchema.index({ 'readBy.userId': 1 });
MessageSchema.index({ 'deliveredTo.userId': 1 });

// ==================== STATIC METHODS ====================

/**
 * Find messages by chat ID
 * @param chatId - Chat ID to search for
 * @param limit - Maximum number of results (default: 50)
 */
MessageSchema.statics.findByChatId = function (
  chatId: string | mongoose.Types.ObjectId,
  limit: number = 50
): Promise<IMessage[]> {
  return this.find({ chatId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('senderId', 'firstname lastname avatar')
    .populate('replyToMessageId')
    .exec();
};

/**
 * Mark message as delivered
 * @param messageId - Message ID
 * @param userId - User ID who received the message
 */
MessageSchema.statics.markAsDelivered = async function (
  messageId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<IMessage | null> {
  const message = await this.findById(messageId);
  
  if (!message) return null;
  
  // Check if already delivered
  const alreadyDelivered = message.deliveredTo.some(
    (delivery: { userId: { toString: () => string; }; }) => delivery.userId.toString() === userId.toString()
  );
  
  if (!alreadyDelivered) {
    message.deliveredTo.push({
      userId: userId as mongoose.Types.ObjectId,
      deliveredAt: new Date(),
    });
    await message.save();
  }
  
  return message;
};

/**
 * Mark message as read
 * @param messageId - Message ID
 * @param userId - User ID who read the message
 */
MessageSchema.statics.markAsRead = async function (
  messageId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<IMessage | null> {
  const message = await this.findById(messageId);
  
  if (!message) return null;
  
  // Check if already read
  const alreadyRead = message.readBy.some(
    (read: { userId: { toString: () => string; }; }) => read.userId.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    message.readBy.push({
      userId: userId as mongoose.Types.ObjectId,
      readAt: new Date(),
    });
    
    // Update legacy fields
    message.read = true;
    message.readAt = new Date();
    
    await message.save();
  }
  
  return message;
};

// ==================== MIDDLEWARE ====================

/**
 * Post-save hook
 * Update the chat's last message and emit signals
 */
MessageSchema.post('save', async function (doc, next) {
  try {
    // Update the chat with the latest message
    const chat = await Chat.findById(doc.chatId);
    if (chat) {
      chat.lastMessageId = doc._id as any;
      chat.lastMessageContent = doc.content || doc.type;
      chat.lastMessagedAt = doc.timestamp;
      await chat.save();
    }
    
    // TODO: Emit socket event for new message
    // This will be handled by the service layer
  } catch (error) {
    console.error('Error updating chat with last message:', error);
  }
  next();
});

/**
 * Post-delete hook
 * Update chat if this was the last message
 */
MessageSchema.post('findOneAndDelete', async function (doc, next) {
  try {
    if (doc) {
      const chat = await Chat.findById(doc.chatId);
      
      // If this was the last message, find the previous one
      if (chat && chat.lastMessageId?.toString() === doc._id.toString()) {
        const previousMessage = await mongoose
          .model<IMessage>('Message')
          .findOne({ chatId: doc.chatId })
          .sort({ timestamp: -1 });
        
        if (previousMessage) {
          chat.lastMessageId = previousMessage._id;
          chat.lastMessageContent = previousMessage.content || previousMessage.type;
          chat.lastMessagedAt = previousMessage.timestamp;
        } else {
          chat.lastMessageId = undefined;
          chat.lastMessageContent = '';
          chat.lastMessagedAt = new Date();
        }
        
        await chat.save();
      }
    }
  } catch (error) {
    console.error('Error updating chat after message deletion:', error);
  }
  next();
});

// ==================== PLUGINS ====================
MessageSchema.plugin(toJson);
MessageSchema.plugin(advancedResultsPlugin);
MessageSchema.plugin(tenantAwarePlugin);

// Apply activity tracker plugin for message actions
MessageSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.MESSAGE,
  entityNameField: 'content',
  getActivityDetails: (doc: IMessage, isNew: boolean) => {
    if (isNew) {
      const preview = doc.content ? doc.content.substring(0, 50) : doc.type;
      return `Sent message: ${preview}${doc.content && doc.content.length > 50 ? '...' : ''}`;
    }
    return `Updated message`;
  },
});

// ==================== EXPORT ====================
const Message = mongoose.model<IMessage, MessageModel & IAdvancedResultsModel<IMessage>>(
  'Message',
  MessageSchema
);

export default Message;
export { MessageSchema };