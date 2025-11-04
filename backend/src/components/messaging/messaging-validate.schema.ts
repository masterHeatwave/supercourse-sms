// src/components/messaging/messaging-validate.schema.ts
import 'zod-openapi/extend';
import { z } from 'zod';
import { ChatType, MessageType, AttachmentStatus, VirusScanStatus, FileCategory, NotificationType } from './messaging.interface';

// ==================== SCHEMA MODELS ====================

export const ChatSchema = z
  .object({
    id: z.string(),
    participants: z.array(z.string()),
    participantsDetails: z.array(z.object({
      _id: z.string(),
      userId: z.string(),
      username: z.string(),
      email: z.string(),
      firstname: z.string(),
      lastname: z.string(),
      userType: z.string(),
      isOnline: z.boolean().optional(),
      lastSeen: z.string().optional(),
      avatar: z.string().optional(),
      displayName: z.string(),
    })).optional(),
    type: z.enum([ChatType.DIRECT, ChatType.GROUP]),
    name: z.string().optional(),
    lastMessageId: z.string().optional(),
    lastMessageContent: z.string().optional(),
    lastMessagedAt: z.string().optional(),
    lastMessageDate: z.string().optional(),
    unreadCount: z.record(z.number()).optional(),
    isStarred: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    isMuted: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    userSettings: z.record(z.any()).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({ title: 'Chat', description: 'Chat model' });

export const MessageSchema = z
  .object({
    id: z.string(),
    senderId: z.string(),
    recipientIds: z.array(z.string()),
    chatId: z.string(),
    content: z.string().optional(),
    type: z.enum([MessageType.TEXT, MessageType.IMAGE, MessageType.FILE, MessageType.VOICE, MessageType.SYSTEM]),
    timestamp: z.string(),
    replyToMessageId: z.string().optional(),
    deliveredTo: z
      .array(
        z.object({
          userId: z.string(),
          deliveredAt: z.string(),
        })
      )
      .optional(),
    readBy: z
      .array(
        z.object({
          userId: z.string(),
          readAt: z.string(),
        })
      )
      .optional(),
    read: z.boolean(),
    readAt: z.string().nullable().optional(),
    senderUsername: z.string().optional(),
    senderFullName: z.string().optional(),
    replyToMessage: z
      .object({
        id: z.string(),
        content: z.string(),
        timestamp: z.string(),
        senderId: z.string(),
        senderUsername: z.string().optional(),
        senderFullName: z.string().optional(),
      })
      .optional()
      .nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({ title: 'Message', description: 'Message model' });

export const AttachmentSchema = z
  .object({
    id: z.string(),
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    fileExtension: z.string().optional(),
    fileSize: z.number(),
    fileSizeFormatted: z.string().optional(),
    fileCategory: z.enum(['image', 'document', 'audio', 'video', 'other']).optional(),
    url: z.string().optional(),
    uploadedBy: z.string(),
    uploadedAt: z.string(),
    chatId: z.string(),
    messageId: z.string().optional(),
    status: z.enum([AttachmentStatus.UPLOADING, AttachmentStatus.READY, AttachmentStatus.ERROR]),
    virusScanStatus: z.enum([VirusScanStatus.PENDING, VirusScanStatus.CLEAN, VirusScanStatus.INFECTED]),
    metadata: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      exif: z.object({
        camera: z.string().optional(),
        location: z.string().optional(),
        dateTaken: z.string().optional(),
      }).optional(),
    }).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({ title: 'Attachment', description: 'Message attachment model' });

export const ReactionSchema = z
  .object({
    id: z.string(),
    messageId: z.string(),
    userId: z.string(),
    emoji: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({ title: 'Reaction', description: 'Message reaction model' });

export const ChatNotificationSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    type: z.enum(['message', 'mention', 'system', 'chat_invite', 'user_online', 'user_offline']),
    title: z.string(),
    content: z.string(),
    relatedUserId: z.string().optional(),
    relatedMessageId: z.string().optional(),
    relatedChatId: z.string().optional(),
    isRead: z.boolean(),
    isDeleted: z.boolean(),
    readAt: z.string().optional().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    relatedUser: z.any().optional(),
    relatedChat: z.any().optional(),
    relatedMessage: z.any().optional(),
  })
  .openapi({ title: 'ChatNotification', description: 'Chat notification' });

// ==================== CREATE/UPDATE SCHEMAS ====================

export const createChatSchema = z
  .object({
    participants: z.array(z.string()).min(2, { message: 'At least 2 participants required' }),
    type: z.enum([ChatType.DIRECT, ChatType.GROUP]).optional(),
    name: z.string().optional(),
  })
  .openapi({ title: 'CreateChat', description: 'Create a new chat' });

export const sendMessageSchema = z
  .object({
    senderId: z.string().min(1, { message: 'Sender ID is required' }),
    chatId: z.string().optional(),
    recipientIds: z.array(z.string()).optional(),
    content: z.string().optional(),
    type: z
      .enum([MessageType.TEXT, MessageType.IMAGE, MessageType.FILE, MessageType.VOICE, MessageType.SYSTEM])
      .optional()
      .default(MessageType.TEXT),
    replyToMessageId: z.string().optional(),
  })
  .refine((d) => !!d.chatId || (d.recipientIds && d.recipientIds.length > 0), {
    path: ['chatId'],
    message: 'Either chatId or recipientIds must be provided',
  })
  .openapi({ title: 'SendMessage', description: 'Send a message' });

export const queryMessagesSchema = z
  .object({
    chatId: z.string().min(1, { message: 'Chat ID is required' }),
    limit: z.string().optional(),
    before: z.string().optional(),
  })
  .openapi({ title: 'QueryMessages', description: 'Query messages in a chat' });

export const markAsDeliveredSchema = z
  .object({
    messageId: z.string().min(1, { message: 'Message ID is required' }),
    userId: z.string().min(1, { message: 'User ID is required' }),
  })
  .openapi({ title: 'MarkAsDelivered', description: 'Mark message as delivered' });

export const markAsReadSchema = z
  .object({
    messageId: z.string().min(1, { message: 'Message ID is required' }),
    userId: z.string().min(1, { message: 'User ID is required' }),
  })
  .openapi({ title: 'MarkAsRead', description: 'Mark message as read' });

export const markChatAsReadSchema = z
  .object({
    chatId: z.string().min(1, { message: 'Chat ID is required' }),
    userId: z.string().min(1, { message: 'User ID is required' }),
  })
  .openapi({ title: 'MarkChatAsRead', description: 'Mark all chat messages as read' });

export const deleteMessageSchema = z
  .object({
    messageId: z.string().min(1, { message: 'Message ID is required' }),
    userId: z.string().optional(),
  })
  .openapi({ title: 'DeleteMessage', description: 'Delete a message' });

export const addReactionSchema = z
  .object({
    emoji: z.string().min(1, { message: 'Emoji is required' }),
  })
  .openapi({ title: 'AddReaction', description: 'Add reaction to a message' });

export const removeReactionSchema = z
  .object({
    emoji: z.string().min(1, { message: 'Emoji is required' }),
  })
  .openapi({ title: 'RemoveReaction', description: 'Remove reaction from a message' });

export const createChatNotificationSchema = z
  .object({
    userId: z.string().min(1, { message: 'User ID is required' }),
    type: z.enum(['message', 'mention', 'system', 'chat_invite', 'user_online', 'user_offline']),
    title: z.string().max(100),
    content: z.string().max(500),
    relatedUserId: z.string().optional(),
    relatedMessageId: z.string().optional(),
    relatedChatId: z.string().optional(),
  })
  .openapi({ title: 'CreateChatNotification', description: 'Create a chat notification' });

export const resetUnreadCountSchema = z
  .object({
    chatId: z.string().min(1, { message: 'Chat ID is required' }),
    userId: z.string().min(1, { message: 'User ID is required' }),
  })
  .openapi({ title: 'ResetUnreadCount', description: 'Reset unread count for a user in a chat' });

export const updateChatSchema = z
  .object({
    name: z.string().optional(),
    isStarred: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    isMuted: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .openapi({ title: 'UpdateChat', description: 'Update chat settings' });

export const uploadAttachmentsSchema = z
  .object({
    chatId: z.string().min(1, { message: 'Chat ID is required' }),
    messageId: z.string().optional(),
    userId: z.string().optional(),
  })
  .openapi({ title: 'UploadAttachments', description: 'Upload files to a chat or message' });

export const getUploadStatusSchema = z
  .object({
    ids: z.array(z.string()).min(1, { message: 'At least one attachment ID is required' }),
    userId: z.string().optional(),
  })
  .openapi({ title: 'GetUploadStatus', description: 'Get upload status for multiple attachments' });

export const notificationPaginationSchema = z
  .object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20),
  })
  .openapi({ title: 'NotificationPagination', description: 'Pagination parameters for notifications' });

export const systemNotificationSchema = z
  .object({
    userIds: z.array(z.string()).min(1, { message: 'At least one user ID is required' }),
    title: z.string().max(100),
    content: z.string().max(500),
  })
  .openapi({ title: 'SystemNotification', description: 'Create system notification for multiple users' });