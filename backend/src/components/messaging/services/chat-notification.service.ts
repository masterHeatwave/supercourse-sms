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
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

export class ChatNotificationService {
  private io: SocketIOServer | null = null;
  private tenantId = requestContextLocalStorage.getStore();

  constructor() {
    this.tenantId = requestContextLocalStorage.getStore();
  }

  /**
   * Set Socket.IO instance for real-time updates
   */
  setSocketIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
  }

  /**
   * Helper: Emit notification safely
   */
  private emitNotification(userId: string, payload: any): void {
    if (!this.io) {
      console.error('❌ Socket.IO instance not available in notification service');
      return;
    }
  
    // ✅ Use ONLY the user room (user is already joined via authenticate)
    const userRoom = `user-${userId}`;
  
    // ✅ Emit to user room ONCE
    this.io.to(userRoom).emit('newNotification', payload);
    
    // ✅ Log room info for debugging
    const roomClients = this.io.sockets.adapter.rooms.get(userRoom)?.size || 0;
    
    if (roomClients === 0) {
      console.warn(`⚠️ No clients in room ${userRoom} - user may be offline or not authenticated`);
    }
  }

  // ==================== MUTE FUNCTIONALITY ====================

  /**
   * ✅ Check if a chat is muted for a specific user
   */
  async isChatMuted(userId: string, chatId: string): Promise<boolean> {
    try {
      const muteNotification = await ChatNotification.findOne({
        userId: new Types.ObjectId(userId),
        relatedChatId: new Types.ObjectId(chatId),
        type: NotificationType.CHAT_MUTED,
        isDeleted: false
      });

      return !!muteNotification;
    } catch (error) {
      console.error('❌ Error checking mute status:', error);
      return false;
    }
  }

  /**
   * ✅ Mute a chat for a user
   */
  async muteChat(userId: string, chatId: string): Promise<void> {
    try {
      // Check if already muted
      const existing = await ChatNotification.findOne({
        userId: new Types.ObjectId(userId),
        relatedChatId: new Types.ObjectId(chatId),
        type: NotificationType.CHAT_MUTED,
        isDeleted: false
      });

      if (existing) {
        return;
      }

      // Create mute notification (hidden from user's notification list)
      await ChatNotification.create({
        userId: new Types.ObjectId(userId),
        relatedChatId: new Types.ObjectId(chatId),
        type: NotificationType.CHAT_MUTED,
        title: 'Chat Muted',
        content: 'This chat has been muted',
        isRead: true, // Mark as read so it doesn't show in notification list
        isDeleted: false
      });

    } catch (error: any) {
      console.error('❌ Error muting chat:', error);
      throw new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✅ Unmute a chat for a user
   */
  async unmuteChat(userId: string, chatId: string): Promise<void> {
    try {
      await ChatNotification.deleteMany({
        userId: new Types.ObjectId(userId),
        relatedChatId: new Types.ObjectId(chatId),
        type: NotificationType.CHAT_MUTED
      });

    } catch (error: any) {
      console.error('❌ Error unmuting chat:', error);
      throw new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✅ Get all muted chat IDs for a user
   */
  async getMutedChatsForUser(userId: string): Promise<string[]> {
    try {
      const muteNotifications = await ChatNotification.find({
        userId: new Types.ObjectId(userId),
        type: NotificationType.CHAT_MUTED,
        isDeleted: false
      }).select('relatedChatId');

      return muteNotifications
        .map(n => n.relatedChatId?.toString())
        .filter((id): id is string => !!id);
    } catch (error) {
      console.error('❌ Error getting muted chats:', error);
      return [];
    }
  }

  // ==================== NOTIFICATION CRUD ====================

  /**
   * Create a notification
   */
  async createNotification(notificationData: IChatNotificationCreateDTO): Promise<IChatNotification> {
    try {
      const notification = await ChatNotification.create({
        userId: new Types.ObjectId(notificationData.userId),
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content,
        relatedUserId: notificationData.relatedUserId
          ? new Types.ObjectId(notificationData.relatedUserId)
          : undefined,
        relatedMessageId: notificationData.relatedMessageId
          ? new Types.ObjectId(notificationData.relatedMessageId)
          : undefined,
        relatedChatId: notificationData.relatedChatId
          ? new Types.ObjectId(notificationData.relatedChatId)
          : undefined,
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
   * ✅ UPDATED: Create message notifications with mute check
   */
  async createMessageNotificationsWithMuteCheck(
    senderId: string,
    recipientIds: string[],
    messageId: string,
    chatId: string,
    messageContent: string
  ): Promise<IChatNotification[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        throw new ErrorResponse(`Invalid senderId format: ${senderId}`, StatusCodes.BAD_REQUEST);
      }

      const sender = await User.findById(senderId)
        .select('username firstname lastname') as { _id: Types.ObjectId; username?: string; firstname?: string; lastname?: string } | null;

      if (!sender) {
        throw new ErrorResponse(`Sender not found: ${senderId}`, StatusCodes.NOT_FOUND);
      }

      const chat = await Chat.findById(chatId);
      if (!chat) throw new ErrorResponse(`Chat not found: ${chatId}`, StatusCodes.NOT_FOUND);

      const notifications: IChatNotification[] = [];
      const senderName = sender.username || `${sender.firstname} ${sender.lastname}`;

      for (const recipientId of recipientIds) {
        if (!mongoose.Types.ObjectId.isValid(recipientId)) continue;
        if (recipientId === sender._id.toString()) continue;

        const recipientExists = await User.exists({ _id: recipientId });
        if (!recipientExists) continue;

        // ✅ CHECK IF CHAT IS MUTED FOR THIS RECIPIENT
        const isMuted = await this.isChatMuted(recipientId, chatId);

        if (isMuted) {
          continue; // Skip notification creation
        }

        // ✅ CREATE NOTIFICATION ONLY IF NOT MUTED
        const notificationData: IChatNotificationCreateDTO = {
          userId: recipientId,
          type: NotificationType.MESSAGE,
          title: 'New message',
          content: `${senderName}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
          relatedUserId: senderId,
          relatedMessageId: messageId,
          relatedChatId: chatId,
        };

        const notification = await this.createNotification(notificationData);
        notifications.push(notification);

        // ✅ Emit real-time notification
        this.emitNotification(recipientId, {
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
    page = 1,
    limit = 20
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

      // ✅ Exclude CHAT_MUTED notifications from user's notification list
      const [notifications, totalCount, unreadCount] = await Promise.all([
        ChatNotification.find({ 
          userId: userObjectId, 
          isDeleted: false,
          type: { $ne: NotificationType.CHAT_MUTED } // ✅ Exclude mute markers
        })
          .populate('relatedUserId', 'username avatar firstname lastname')
          .populate('relatedChatId', 'name type')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChatNotification.countDocuments({ 
          userId: userObjectId, 
          isDeleted: false,
          type: { $ne: NotificationType.CHAT_MUTED }
        }),
        ChatNotification.countDocuments({ 
          userId: userObjectId, 
          isRead: false, 
          isDeleted: false,
          type: { $ne: NotificationType.CHAT_MUTED }
        }),
      ]);

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
   * Get unread notification count
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      return await ChatNotification.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
        isDeleted: false,
        type: { $ne: NotificationType.CHAT_MUTED } // ✅ Exclude mute markers
      });
    } catch (error: any) {
      console.error('❌ Error getting unread count:', error);
      throw new ErrorResponse(`Error getting unread count: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<IChatNotification> {
    try {
      const notification = await ChatNotification.findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        },
        { isRead: true, readAt: new Date() },
        { new: true }
      ).populate('relatedUserId', 'username avatar firstname lastname');

      if (!notification) throw new ErrorResponse('Notification not found', StatusCodes.NOT_FOUND);
      return notification;
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId: string): Promise<{ modifiedCount: number; message: string }> {
    try {
      const result = await ChatNotification.updateMany(
        { 
          userId: new Types.ObjectId(userId), 
          isRead: false, 
          isDeleted: false,
          type: { $ne: NotificationType.CHAT_MUTED } // ✅ Don't mark mute markers as read
        },
        { isRead: true, readAt: new Date() }
      );
      return { modifiedCount: result.modifiedCount || 0, message: `${result.modifiedCount} marked as read` };
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      throw new ErrorResponse(`Error marking all as read: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete single notification (soft delete)
   */
  async deleteNotification(notificationId: string, userId: string): Promise<IChatNotification> {
    try {
      const notification = await ChatNotification.findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        },
        { isDeleted: true, updatedAt: new Date() },
        { new: true }
      );
      if (!notification) throw new ErrorResponse('Notification not found', StatusCodes.NOT_FOUND);
      return notification;
    } catch (error: any) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications (soft delete)
   */
  async clearAllNotifications(userId: string): Promise<{ modifiedCount: number; message: string }> {
    try {
      const result = await ChatNotification.updateMany(
        { 
          userId: new Types.ObjectId(userId), 
          isDeleted: false,
          type: { $ne: NotificationType.CHAT_MUTED } // ✅ Don't delete mute markers
        },
        { isDeleted: true, updatedAt: new Date() }
      );
      return { modifiedCount: result.modifiedCount || 0, message: `${result.modifiedCount} cleared` };
    } catch (error: any) {
      console.error('❌ Error clearing notifications:', error);
      throw new ErrorResponse(`Error clearing all: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(
    userId: string,
    type: NotificationType,
    page = 1,
    limit = 10
  ): Promise<{ notifications: IChatNotification[]; totalCount: number; currentPage: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const userObjectId = new Types.ObjectId(userId);

      const [notifications, totalCount] = await Promise.all([
        ChatNotification.find({ userId: userObjectId, type, isDeleted: false })
          .populate('relatedUserId', 'username avatar firstname lastname')
          .populate('relatedChatId', 'name type')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChatNotification.countDocuments({ userId: userObjectId, type, isDeleted: false }),
      ]);

      return {
        notifications: notifications as IChatNotification[],
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error: any) {
      console.error('❌ Error fetching notifications by type:', error);
      throw new ErrorResponse(`Error fetching notifications by type: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create system notification for one or more users
   */
  async createSystemNotification(userIds: string[], title: string, content: string): Promise<IChatNotification[]> {
    try {
      const notifications: IChatNotification[] = [];
      for (const userId of userIds) {
        const notification = await this.createNotification({
          userId,
          type: NotificationType.SYSTEM,
          title,
          content,
        });
        notifications.push(notification);
        this.emitNotification(userId, {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
        });
      }
      return notifications;
    } catch (error: any) {
      console.error('❌ Error creating system notification:', error);
      throw new ErrorResponse(`Error creating system notification: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a welcome notification for new users
   */
  async createWelcomeNotification(userId: string): Promise<IChatNotification> {
    try {
      const notification = await this.createNotification({
        userId,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Messaging!',
        content: 'Start chatting with your colleagues and manage your conversations here.',
      });

      this.emitNotification(userId, {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      });

      return notification;
    } catch (error: any) {
      console.error('❌ Error creating welcome notification:', error);
      throw error;
    }
  }
}