// src/components/messaging/services/chat-notification.service.ts
import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import ChatNotification from '../models/chat-notification.model';
import Chat from '../models/chat.model';
import User from '@components/users/user.model';
import {
  IChatNotification,
  IChatNotificationCreateDTO,
  NotificationType,
} from '../messaging.interface';
import { Server as SocketIOServer } from 'socket.io';

export class ChatNotificationService {
  private io: SocketIOServer | null = null;

  /**
   * Set Socket.IO instance for real-time updates
   */
  setSocketIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData: IChatNotificationCreateDTO): Promise<IChatNotification> {
    try {
      const notification = await ChatNotification.create({
        userId: new Types.ObjectId(notificationData.userId),
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content,
        relatedUserId: notificationData.relatedUserId ? new Types.ObjectId(notificationData.relatedUserId) : undefined,
        relatedMessageId: notificationData.relatedMessageId
          ? new Types.ObjectId(notificationData.relatedMessageId)
          : undefined,
        relatedChatId: notificationData.relatedChatId ? new Types.ObjectId(notificationData.relatedChatId) : undefined,
      });

      await notification.populate([
        { path: 'relatedUserId', select: 'username avatar firstname lastname' },
        { path: 'relatedChatId', select: 'name type' },
      ]);

      return notification;
    } catch (error: any) {
      console.error('❌ Error creating notification:', error);
      throw new ErrorResponse(`Error creating notification: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create notification for new message with mute check
   */
  async createMessageNotificationsWithMuteCheck(
    senderId: string,
    recipientIds: string[],
    messageId: string,
    chatId: string,
    messageContent: string
  ): Promise<IChatNotification[]> {
    try {
      console.log(`📨 Creating message notification - Sender: ${senderId}, Recipients: ${recipientIds.join(', ')}`);

      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        throw new ErrorResponse(`Invalid senderId format: ${senderId}`, StatusCodes.BAD_REQUEST);
      }

      const senderObjectId = new Types.ObjectId(senderId);

      const sender = await User.findById(senderObjectId).select('username firstname lastname');

      if (!sender) {
        console.error('❌ Sender not found with user ID:', senderId);
        throw new ErrorResponse(`Sender not found: ${senderId}`, StatusCodes.NOT_FOUND);
      }

      console.log('✅ Found sender:', sender.username, 'with _id:', sender._id);

      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.error('❌ Chat not found:', chatId);
        throw new ErrorResponse(`Chat not found: ${chatId}`, StatusCodes.NOT_FOUND);
      }

      const notifications: IChatNotification[] = [];
      const senderName = sender.username || `${sender.firstname} ${sender.lastname}`;

      for (const recipientId of recipientIds) {
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
          console.error('❌ Invalid recipientId format:', recipientId);
          continue;
        }

        const recipientObjectId = new Types.ObjectId(recipientId);

        const senderActualId = sender._id ? sender._id.toString() : senderId;
        if (recipientId === senderActualId) {
          console.log(`⏭️ Skipping sender ${recipientId}`);
          continue;
        }

        const recipientExists = await User.findById(recipientObjectId);
        if (!recipientExists) {
          console.error('❌ Recipient not found with user ID:', recipientId);
          continue;
        }

        console.log(`📝 Creating notification for recipient: ${recipientId}`);

        const notificationData: IChatNotificationCreateDTO = {
          userId: recipientId,
          type: NotificationType.MESSAGE,
          title: 'New message',
          content: `${senderName}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
          relatedUserId: senderId,
          relatedMessageId: messageId,
          relatedChatId: chatId,
        };

        try {
          const notification = await this.createNotification(notificationData);
          console.log(`✅ Created notification: ${notification._id} for user ${recipientId}`);
          notifications.push(notification);

          if (this.io) {
            this.io.to(recipientId).emit('newNotification', {
              _id: notification._id,
              type: notification.type,
              title: notification.title,
              content: notification.content,
              createdAt: notification.createdAt,
              isRead: notification.isRead,
              relatedUserId: notification.relatedUserId,
              relatedChatId: notification.relatedChatId,
              relatedMessageId: notification.relatedMessageId,
            });
          }
        } catch (notifError) {
          console.error(`❌ Failed to create notification for recipient ${recipientId}:`, notifError);
        }
      }

      console.log(
        `🎉 Successfully created ${notifications.length} notifications (${recipientIds.length - notifications.length} were muted or skipped)`
      );
      return notifications;
    } catch (error: any) {
      console.error('❌ Error in createMessageNotificationsWithMuteCheck:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: IChatNotification[];
    totalCount: number;
    unreadCount: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    try {
      const skip = (page - 1) * limit;
      const userObjectId = new Types.ObjectId(userId);

      const notifications = await ChatNotification.find({
        userId: userObjectId,
        isDeleted: false,
      })
        .populate('relatedUserId', 'username avatar firstname lastname')
        .populate('relatedChatId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalCount = await ChatNotification.countDocuments({
        userId: userObjectId,
        isDeleted: false,
      });

      const unreadCount = await ChatNotification.countDocuments({
        userId: userObjectId,
        isRead: false,
        isDeleted: false,
      });

      return {
        notifications: notifications as IChatNotification[],
        totalCount,
        unreadCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      };
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error);
      throw new ErrorResponse(`Error fetching notifications: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get unread notifications count only
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const unreadCount = await ChatNotification.countDocuments({
        userId: userObjectId,
        isRead: false,
        isDeleted: false,
      });

      return unreadCount;
    } catch (error: any) {
      console.error('❌ Error getting unread count:', error);
      throw new ErrorResponse(`Error getting unread count: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Mark single notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<IChatNotification> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const notificationObjectId = new Types.ObjectId(notificationId);

      const notification = await ChatNotification.findOneAndUpdate(
        {
          _id: notificationObjectId,
          userId: userObjectId,
          isDeleted: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      ).populate('relatedUserId', 'username avatar firstname lastname');

      if (!notification) {
        throw new ErrorResponse('Notification not found or already deleted', StatusCodes.NOT_FOUND);
      }

      return notification;
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<{ modifiedCount: number; message: string }> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const result = await ChatNotification.updateMany(
        {
          userId: userObjectId,
          isRead: false,
          isDeleted: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      return {
        modifiedCount: result.modifiedCount || 0,
        message: `${result.modifiedCount} notifications marked as read`,
      };
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      throw new ErrorResponse(
        `Error marking all notifications as read: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Soft delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<IChatNotification> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const notificationObjectId = new Types.ObjectId(notificationId);

      const notification = await ChatNotification.findOneAndUpdate(
        {
          _id: notificationObjectId,
          userId: userObjectId,
          isDeleted: false,
        },
        {
          isDeleted: true,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!notification) {
        throw new ErrorResponse('Notification not found or already deleted', StatusCodes.NOT_FOUND);
      }

      return notification;
    } catch (error: any) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications for a user (soft delete)
   */
  async clearAllNotifications(userId: string): Promise<{ modifiedCount: number; message: string }> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const result = await ChatNotification.updateMany(
        { userId: userObjectId, isDeleted: false },
        {
          isDeleted: true,
          updatedAt: new Date(),
        }
      );

      return {
        modifiedCount: result.modifiedCount || 0,
        message: `${result.modifiedCount} notifications cleared`,
      };
    } catch (error: any) {
      console.error('❌ Error clearing all notifications:', error);
      throw new ErrorResponse(`Error clearing all notifications: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(
    userId: string,
    type: NotificationType,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    notifications: IChatNotification[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const userObjectId = new Types.ObjectId(userId);

      const notifications = await ChatNotification.find({
        userId: userObjectId,
        type,
        isDeleted: false,
      })
        .populate('relatedUserId', 'username avatar firstname lastname')
        .populate('relatedChatId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalCount = await ChatNotification.countDocuments({
        userId: userObjectId,
        type,
        isDeleted: false,
      });

      return {
        notifications: notifications as IChatNotification[],
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error: any) {
      console.error('❌ Error fetching notifications by type:', error);
      throw new ErrorResponse(
        `Error fetching notifications by type: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create system notification (for admin messages, updates, etc.)
   */
  async createSystemNotification(userIds: string[], title: string, content: string): Promise<IChatNotification[]> {
    try {
      const notifications: IChatNotification[] = [];

      for (const userId of userIds) {
        const notificationData: IChatNotificationCreateDTO = {
          userId,
          type: NotificationType.SYSTEM,
          title,
          content,
        };

        const notification = await this.createNotification(notificationData);
        notifications.push(notification);

        if (this.io) {
          this.io.to(userId).emit('newNotification', {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            createdAt: notification.createdAt,
            isRead: notification.isRead,
          });
        }
      }

      return notifications;
    } catch (error: any) {
      console.error('❌ Error creating system notification:', error);
      throw new ErrorResponse(
        `Error creating system notification: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createWelcomeNotification(userId: string): Promise<IChatNotification> {
    try {
      console.log('🎉 Creating welcome notification for user:', userId);
      
      const notificationData: IChatNotificationCreateDTO = {
        userId,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Messaging!',
        content: 'Start chatting with your colleagues and manage your conversations here.',
      };
  
      const notification = await this.createNotification(notificationData);
      
      // Emit socket event if connected
      if (this.io) {
        this.io.to(userId).emit('newNotification', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
        });
      }
  
      return notification;
    } catch (error: any) {
      console.error('❌ Error creating welcome notification:', error);
      throw error;
    }
  }
}