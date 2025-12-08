// src/components/messaging/services/message.service.ts
import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import Message from '../models/message.model';
import Chat from '../models/chat.model';
import User from '@components/users/user.model';
import {
  IMessage,
  ISendMessageDTO,
  ChatType,
  MessageType,
} from '../messaging.interface';
import { Server as SocketIOServer } from 'socket.io';
import { ChatNotificationService } from './chat-notification.service';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { StorageService } from '@components/storage/storage.service';

export class MessageService {
  private io: SocketIOServer | null = null;
  private notificationService: ChatNotificationService;
  private storageService: StorageService;

  constructor() {
    this.notificationService = new ChatNotificationService();
    this.storageService = new StorageService();
  }

  /**
   * Set Socket.IO instance for real-time updates
   */
  setSocketIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
    this.notificationService.setSocketIO(ioInstance);
  }

  private getUsersCollectionName(): string {
    const tenantId = requestContextLocalStorage.getStore();
    if (!tenantId) {
      throw new ErrorResponse('Tenant context not available', StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return `${tenantId}_users`;
  }

  private getMessagesCollectionName(): string {
    const tenantId = requestContextLocalStorage.getStore();
    if (!tenantId) {
      throw new ErrorResponse('Tenant context not available', StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return `${tenantId}_messages`;
  }

  private getStorageFilesCollectionName(): string {
    const tenantId = requestContextLocalStorage.getStore();
    if (!tenantId) {
      throw new ErrorResponse('Tenant context not available', StatusCodes.INTERNAL_SERVER_ERROR);
    }
    // user said: StorageFile → 'storagefile'
    return `${tenantId}_storagefiles`;
  }

  /**
   * Send a message, creating a chat if needed
   * Now supports attachments on the message payload.
   */
  async sendMessage(payload: ISendMessageDTO): Promise<any> {
    try {
      const senderId = payload.senderId;
  
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new ErrorResponse('Sender not found', StatusCodes.NOT_FOUND);
      }
  
      let chatId = payload.chatId;
  
      if (!chatId) {
        const participants = Array.from(new Set([senderId, ...(payload.recipientIds || [])]));
        if (participants.length < 2) {
          throw new ErrorResponse('Provide chatId or at least one recipient', StatusCodes.BAD_REQUEST);
        }
  
        const type = participants.length === 2 ? ChatType.DIRECT : ChatType.GROUP;
  
        if (type === ChatType.DIRECT) {
          const existing = await Chat.findOne({
            type: ChatType.DIRECT,
            participants: { $all: participants },
            $expr: { $eq: [{ $size: '$participants' }, participants.length] },
          });
          if (existing) {
            chatId = (existing._id as Types.ObjectId).toString();
          }
        }
  
        if (!chatId) {
          const chat = await Chat.create({
            participants,
            type,
            lastMessageContent: '',
            lastMessagedAt: new Date(),
          });
          chatId = (chat._id as Types.ObjectId).toString();
        }
      }
  
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
      }
  
      // ✅ FIXED: Check attachments first, then validate
      const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0;
      const hasContent = payload.content && payload.content.trim().length > 0;
  
      // ✅ NEW VALIDATION: Must have either content OR attachments
      if (!hasContent && !hasAttachments) {
        throw new ErrorResponse('Message must have either content or attachments', StatusCodes.BAD_REQUEST);
      }
  
      if (payload.replyToMessageId) {
        const replyToMessage = await Message.findById(payload.replyToMessageId);
        if (!replyToMessage) {
          throw new ErrorResponse('Reply-to message not found', StatusCodes.NOT_FOUND);
        }
        if (replyToMessage.chatId.toString() !== chatId.toString()) {
          throw new ErrorResponse('Reply-to message must be in the same chat', StatusCodes.BAD_REQUEST);
        }
      }
  
      const messageData: any = {
        senderId: new Types.ObjectId(senderId),
        recipientIds: chat.participants.filter((p: any) => p.toString() !== senderId.toString()),
        chatId: new Types.ObjectId(chatId),
        content: payload.content || '',
        type: payload.type || MessageType.TEXT,
        timestamp: payload.timestamp || new Date(),
        deliveredTo: [],
        readBy: [],
        read: false,
      };
  
      if (payload.replyToMessageId) {
        messageData.replyToMessageId = new Types.ObjectId(payload.replyToMessageId);
      }
  
      // ✅ Attachments from payload
      if (hasAttachments) {
        messageData.attachments = payload.attachments!.map((att: any) => ({
          fileId: new Types.ObjectId(att.fileId),
          filename: att.filename,
          key: att.key,
          size: att.size,
          contentType: att.contentType,
        }));
      }
  
      const message = await Message.create(messageData);
  
      chat.lastMessageId = message._id as any;
      // ✅ Better last message content display
      if (hasContent) {
        chat.lastMessageContent = payload.content!;
      } else if (hasAttachments) {
        chat.lastMessageContent = `📎 ${payload.attachments!.length} attachment(s)`;
      } else {
        chat.lastMessageContent = message.type;
      }
      chat.lastMessagedAt = new Date();
  
      chat.participants.forEach((participantId: Types.ObjectId) => {
        const participantIdStr = participantId.toString();
        if (participantIdStr !== senderId) {
          const currentCount = chat.unreadCount.get(participantIdStr) || 0;
          chat.unreadCount.set(participantIdStr, currentCount + 1);
        }
      });
  
      await chat.save();
  
      let completeMessage = await this.getCompleteMessage(message._id.toString());
      if (completeMessage) {
        completeMessage = await this.enrichSingleMessageWithAttachmentUrls(completeMessage);
      }
  
      this.emitNewMessage(completeMessage, [
        senderId,
        ...messageData.recipientIds.map((id: Types.ObjectId) => id.toString()),
      ]);
  
      await this.notificationService.createMessageNotificationsWithMuteCheck(
        senderId,
        messageData.recipientIds.map((id: Types.ObjectId) => id.toString()),
        message._id.toString(),
        chatId,
        hasContent ? payload.content! : (hasAttachments ? `📎 ${payload.attachments!.length} attachment(s)` : '')
      );
  
      return completeMessage;
    } catch (err: any) {
      console.error('❌ Error in sendMessage:', err);
      throw err;
    }
  }

  /**
   * Get messages for a chat
   * Includes attachments + signed URLs (Option C)
   */
  async getMessages(chatId: string, options: { limit?: number; before?: string } = {}): Promise<any[]> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }

    const matchStage: any = { chatId: new Types.ObjectId(chatId) };

    if (options.before) {
      const beforeDate = new Date(options.before);
      if (!isNaN(beforeDate.getTime())) {
        matchStage.timestamp = { $lt: beforeDate };
      }
    }

    const limit = options.limit && options.limit > 0 ? options.limit : 50;

    const messages = await Message.aggregate([
      { $match: matchStage },

      // Sender info
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },

      // Reply-to message
      {
        $lookup: {
          from: this.getMessagesCollectionName(),
          localField: 'replyToMessageId',
          foreignField: '_id',
          as: 'replyToMessage',
        },
      },
      { $unwind: { path: '$replyToMessage', preserveNullAndEmptyArrays: true } },

      // Reply-to sender
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'replyToMessage.senderId',
          foreignField: '_id',
          as: 'replyToMessageSender',
        },
      },
      { $unwind: { path: '$replyToMessageSender', preserveNullAndEmptyArrays: true } },

      // 🔍 Lookup attachment StorageFile docs (as requested)
      {
        $lookup: {
          from: this.getStorageFilesCollectionName(),
          localField: 'attachments.fileId',
          foreignField: '_id',
          as: 'attachmentFiles',
        },
      },

      {
        $project: {
          _id: 1,
          content: 1,
          timestamp: 1,
          type: 1,
          senderId: 1,
          recipientIds: 1,
          readBy: 1,
          deliveredTo: 1,
          chatId: 1,
          read: 1,
          readAt: 1,
          replyToMessageId: 1,
          attachments: 1,
          reactions: 1,
          senderUsername: '$sender.username',
          senderFullName: {
            $concat: [
              { $ifNull: ['$sender.firstname', ''] },
              ' ',
              { $ifNull: ['$sender.lastname', ''] },
            ],
          },
          replyToMessage: {
            $cond: {
              if: { $ifNull: ['$replyToMessage._id', false] },
              then: {
                _id: '$replyToMessage._id',
                content: '$replyToMessage.content',
                timestamp: '$replyToMessage.timestamp',
                senderId: '$replyToMessage.senderId',
                senderUsername: '$replyToMessageSender.username',
                senderFullName: {
                  $concat: [
                    { $ifNull: ['$replyToMessageSender.firstname', ''] },
                    ' ',
                    { $ifNull: ['$replyToMessageSender.lastname', ''] },
                  ],
                },
              },
              else: null,
            },
          },
          // attachmentFiles is not projected outward; we just used lookup if needed
        },
      },

      { $sort: { timestamp: 1 } },
      { $limit: limit },
    ]);

    return this.enrichMessagesWithAttachmentUrls(messages);
  }

  /**
   * Legacy: Get messages with pagination
   */
  async getMessagesByChatId(chatId: string, page: number = 1, limit: number = 50): Promise<any[]> {
    const skip = (page - 1) * limit;

    const messages = await Message.aggregate([
      { $match: { chatId: new Types.ObjectId(chatId) } },
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.getMessagesCollectionName(),
          localField: 'replyToMessageId',
          foreignField: '_id',
          as: 'replyToMessage',
        },
      },
      { $unwind: { path: '$replyToMessage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'replyToMessage.senderId',
          foreignField: '_id',
          as: 'replyToMessageSender',
        },
      },
      { $unwind: { path: '$replyToMessageSender', preserveNullAndEmptyArrays: true } },

      // 🔍 Attachments lookup
      {
        $lookup: {
          from: this.getStorageFilesCollectionName(),
          localField: 'attachments.fileId',
          foreignField: '_id',
          as: 'attachmentFiles',
        },
      },

      {
        $project: {
          content: 1,
          timestamp: 1,
          type: 1,
          senderId: 1,
          recipientIds: 1,
          readBy: 1,
          deliveredTo: 1,
          chatId: 1,
          read: 1,
          readAt: 1,
          replyToMessageId: 1,
          attachments: 1,
          reactions: 1,
          senderUsername: '$sender.username',
          senderFullName: {
            $concat: [
              { $ifNull: ['$sender.firstname', ''] },
              ' ',
              { $ifNull: ['$sender.lastname', ''] },
            ],
          },
          replyToMessage: {
            $cond: {
              if: { $ifNull: ['$replyToMessage._id', false] },
              then: {
                _id: '$replyToMessage._id',
                content: '$replyToMessage.content',
                timestamp: '$replyToMessage.timestamp',
                senderId: '$replyToMessage.senderId',
                senderUsername: '$replyToMessageSender.username',
                senderFullName: {
                  $concat: [
                    { $ifNull: ['$replyToMessageSender.firstname', ''] },
                    ' ',
                    { $ifNull: ['$replyToMessageSender.lastname', ''] },
                  ],
                },
              },
              else: null,
            },
          },
        },
      },
      { $sort: { timestamp: 1 } },
      { $skip: skip },
      ...(limit > 0 ? [{ $limit: limit }] : []),
    ]);

    return this.enrichMessagesWithAttachmentUrls(messages);
  }

  /**
   * Mark a single message as read
   */
  async markMessageRead(messageId: string, userId?: string): Promise<IMessage> {

    const message = await Message.findById(messageId);
    if (!message) {
      throw new ErrorResponse('Message not found', StatusCodes.NOT_FOUND);
    }

    if (!message.read) {
      message.read = true;
      message.readAt = new Date();
    }

    if (userId) {
      const alreadyRead = message.readBy.some((r) => r.userId.toString() === userId);
      if (!alreadyRead) {
        const alreadyDelivered = message.deliveredTo.some((d) => d.userId.toString() === userId);
        if (!alreadyDelivered) {
          message.deliveredTo.push({
            userId: new Types.ObjectId(userId),
            deliveredAt: new Date(),
          });
        }

        message.readBy.push({
          userId: new Types.ObjectId(userId),
          readAt: new Date(),
        });

        await message.save();

        if (this.io) {
          const senderId = message.senderId.toString();
          const chatIdStr = message.chatId.toString();

          this.io.to(`user-${senderId}`).emit('messageRead', {
            messageId,
            userId,
            readAt: new Date(),
            chatId: chatIdStr,
          });

          this.io.to(`chat-${chatIdStr}`).emit('messageRead', {
            messageId,
            userId,
            readAt: new Date(),
            chatId: chatIdStr,
          });
        }
      } 
    } else {
      await message.save();
    }

    return message;
  }

  /**
   * Mark all messages in a chat as read by a user
   */
  async markChatMessagesAsRead(chatId: string, userId: string): Promise<IMessage[]> {

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }

    const unreadMessages = await Message.find({
      chatId: new Types.ObjectId(chatId),
      senderId: { $ne: new Types.ObjectId(userId) },
      'readBy.userId': { $ne: new Types.ObjectId(userId) },
    });

    if (unreadMessages.length === 0) {
      chat.unreadCount.set(userId, 0);
      await chat.save();
      return [];
    }

    const readTimestamp = new Date();
    const updatedMessages: IMessage[] = [];
    const uniqueSenders = new Set<string>();

    for (const message of unreadMessages) {
      const alreadyDelivered = message.deliveredTo.some((d) => d.userId.toString() === userId);
      if (!alreadyDelivered) {
        message.deliveredTo.push({
          userId: new Types.ObjectId(userId),
          deliveredAt: readTimestamp,
        });
      }

      message.readBy.push({
        userId: new Types.ObjectId(userId),
        readAt: readTimestamp,
      });

      message.read = true;
      message.readAt = readTimestamp;

      await message.save();
      updatedMessages.push(message);

      uniqueSenders.add(message.senderId.toString());
    }

    if (this.io) {
      uniqueSenders.forEach((senderId) => {

        this.io?.to(`user-${senderId}`).emit('messageRead', {
          chatId,
          userId,
          readAt: readTimestamp,
          messageCount: updatedMessages.filter((m) => m.senderId.toString() === senderId).length,
        });
      });

      this.io?.to(`chat-${chatId}`).emit('messagesRead', {
        chatId,
        userId,
        readAt: readTimestamp,
        messageIds: updatedMessages.map((m) => m._id.toString()),
      });
    }

    chat.unreadCount.set(userId, 0);
    chat.markModified('unreadCount');
    await chat.save();

    return updatedMessages;
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(messageId: string, userId: string): Promise<IMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ErrorResponse('Message not found', StatusCodes.NOT_FOUND);
    }

    const alreadyDelivered = message.deliveredTo.some((d) => d.userId.toString() === userId);

    if (!alreadyDelivered) {
      message.deliveredTo.push({
        userId: new Types.ObjectId(userId),
        deliveredAt: new Date(),
      });
      await message.save();

      if (this.io) {
        this.io.to(message.senderId.toString()).emit('messageDelivered', {
          messageId,
          userId,
          deliveredAt: new Date(),
        });
      }
    }

    return message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId?: string): Promise<IMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ErrorResponse('Message not found', StatusCodes.NOT_FOUND);
    }

    if (userId && message.senderId.toString() !== userId) {
      throw new ErrorResponse('Unauthorized: Only the sender can delete this message', StatusCodes.FORBIDDEN);
    }

    const deleted = await Message.findByIdAndDelete(messageId);
    if (!deleted) {
      throw new ErrorResponse('Message could not be deleted', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    if (this.io) {
      deleted.recipientIds.forEach((rId) => {
        this.io?.to(rId.toString()).emit('messageDeleted', {
          messageId: deleted._id,
          chatId: deleted.chatId,
        });
      });
      this.io.to(deleted.senderId.toString()).emit('messageDeleted', {
        messageId: deleted._id,
        chatId: deleted.chatId,
      });
    }

    return deleted;
  }

  /**
   * Get messages by user (incoming / sent)
   */
  async getMessagesByUserId(userId: string, field: 'senderId' | 'recipientIds'): Promise<any[]> {
    const id = new Types.ObjectId(userId);
    const matchField = field === 'recipientIds' ? 'recipientIds' : 'senderId';

    const messages = await Message.aggregate([
      { $match: { [matchField]: id } },
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'recipientIds',
          foreignField: '_id',
          as: 'recipients',
        },
      },
      // Optional: lookup attachments here as well if needed
      {
        $lookup: {
          from: this.getStorageFilesCollectionName(),
          localField: 'attachments.fileId',
          foreignField: '_id',
          as: 'attachmentFiles',
        },
      },
      {
        $project: {
          content: 1,
          timestamp: 1,
          type: 1,
          senderId: 1,
          recipientIds: 1,
          readBy: 1,
          deliveredTo: 1,
          chatId: 1,
          attachments: 1,
          senderUsername: '$sender.username',
          recipientUsernames: '$recipients.username',
        },
      },
      { $sort: { timestamp: -1 } },
    ]);

    return this.enrichMessagesWithAttachmentUrls(messages);
  }

  /**
   * Get a single complete message
   */
  private async getCompleteMessage(messageId: string): Promise<any> {
    const messages = await Message.aggregate([
      { $match: { _id: new Types.ObjectId(messageId) } },
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.getMessagesCollectionName(),
          localField: 'replyToMessageId',
          foreignField: '_id',
          as: 'replyToMessage',
        },
      },
      { $unwind: { path: '$replyToMessage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'replyToMessage.senderId',
          foreignField: '_id',
          as: 'replyToMessageSender',
        },
      },
      { $unwind: { path: '$replyToMessageSender', preserveNullAndEmptyArrays: true } },

      // 🔍 Attachments lookup
      {
        $lookup: {
          from: this.getStorageFilesCollectionName(),
          localField: 'attachments.fileId',
          foreignField: '_id',
          as: 'attachmentFiles',
        },
      },

      {
        $project: {
          _id: 1,
          senderId: 1,
          recipientIds: 1,
          chatId: 1,
          content: 1,
          type: 1,
          timestamp: 1,
          readBy: 1,
          deliveredTo: 1,
          read: 1,
          readAt: 1,
          replyToMessageId: 1,
          attachments: 1,
          reactions: 1,
          senderUsername: '$sender.username',
          senderFullName: {
            $concat: [
              { $ifNull: ['$sender.firstname', ''] },
              ' ',
              { $ifNull: ['$sender.lastname', ''] },
            ],
          },
          replyToMessage: {
            $cond: {
              if: { $ifNull: ['$replyToMessage._id', false] },
              then: {
                _id: '$replyToMessage._id',
                content: '$replyToMessage.content',
                timestamp: '$replyToMessage.timestamp',
                senderId: '$replyToMessage.senderId',
                senderUsername: '$replyToMessageSender.username',
                senderFullName: {
                  $concat: [
                    { $ifNull: ['$replyToMessageSender.firstname', ''] },
                    ' ',
                    { $ifNull: ['$replyToMessageSender.lastname', ''] },
                  ],
                },
              },
              else: null,
            },
          },
        },
      },
    ]);

    const message = messages[0] || null;
    if (!message) return null;

    return this.enrichSingleMessageWithAttachmentUrls(message);
  }

  /**
   * Emit new message to all participants (including attachments)
   */
  private emitNewMessage(message: any, participantIds: string[]): void {
    if (!this.io) {
      console.error('❌ Socket.IO instance not available');
      return;
    }

    const uniqueParticipants = [...new Set(participantIds.map((id) => id.toString()))];
    const chatIdString = message.chatId.toString();

    uniqueParticipants.forEach((participantId) => {
      this.io?.to(`user-${participantId}`).emit('newMessage', {
        ...message,
        _id: message._id.toString(),
        chatId: chatIdString,
        senderId: message.senderId.toString(),
        recipientIds: message.recipientIds.map((id: any) => id.toString()),
      });
    });

    this.io?.to(`chat-${chatIdString}`).emit('newMessage', {
      ...message,
      _id: message._id.toString(),
      chatId: chatIdString,
      senderId: message.senderId.toString(),
      recipientIds: message.recipientIds.map((id: any) => id.toString()),
    });

  }

  // =========================================================
  // ATTACHMENT URL ENRICHMENT (Option C)
  // =========================================================

  private async enrichMessagesWithAttachmentUrls(messages: any[]): Promise<any[]> {
    const enriched: any[] = [];

    for (const msg of messages) {
      enriched.push(await this.enrichSingleMessageWithAttachmentUrls(msg));
    }

    return enriched;
  }

  private async enrichSingleMessageWithAttachmentUrls(message: any): Promise<any> {
    if (!Array.isArray(message.attachments) || message.attachments.length === 0) {
      return message;
    }

    const enrichedAttachments = [];

    for (const att of message.attachments) {
      if (!att || !att.key) {
        enrichedAttachments.push(att);
        continue;
      }

      try {
        // force = true for "download" behavior
        const url = await this.storageService.getFile(att.key, true);
        enrichedAttachments.push({
          ...att,
          url,
        });
      } catch (err) {
        console.error('Error generating signed URL for attachment:', err);
        enrichedAttachments.push({
          ...att,
          url: null,
        });
      }
    }

    message.attachments = enrichedAttachments;
    return message;
  }
}
