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

export class MessageService {
  private io: SocketIOServer | null = null;

  private notificationService: ChatNotificationService;

  constructor() {

    this.notificationService = new ChatNotificationService();

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

  /**
   * Send a message, creating a chat if needed
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

      if (!payload.content && payload.type === MessageType.TEXT) {
        throw new ErrorResponse('Text message requires content', StatusCodes.BAD_REQUEST);
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
        content: payload.content,
        type: payload.type || MessageType.TEXT,
        timestamp: payload.timestamp || new Date(),
        deliveredTo: [],
        readBy: [],
        read: false,
      };

      if (payload.replyToMessageId) {
        messageData.replyToMessageId = new Types.ObjectId(payload.replyToMessageId);
      }

      const message = await Message.create(messageData);

      chat.lastMessageId = message._id as any;
      chat.lastMessageContent = message.type === MessageType.TEXT ? (payload.content ?? '') : message.type;
      chat.lastMessagedAt = new Date();

      chat.participants.forEach((participantId: Types.ObjectId) => {
        const participantIdStr = participantId.toString();
        if (participantIdStr !== senderId) {
          const currentCount = chat.unreadCount.get(participantIdStr) || 0;
          chat.unreadCount.set(participantIdStr, currentCount + 1);
        }
      });

      await chat.save();

      const completeMessage = await this.getCompleteMessage(message._id.toString());

      this.emitNewMessage(completeMessage, [
        senderId,
        ...messageData.recipientIds.map((id: Types.ObjectId) => id.toString()),
      ]);

      await this.notificationService.createMessageNotificationsWithMuteCheck(
        senderId,
        messageData.recipientIds.map((id: Types.ObjectId) => id.toString()),
        message._id.toString(),
        chatId,
        payload.content || '[Attachment]'
      );

      return completeMessage;
    } catch (err: any) {
      console.error('❌ Error in sendMessage:', err);
      throw err;
    }
  }

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string, options: { limit?: number; before?: string } = {}): Promise<any[]> {
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }
  
    // Build match stage
    const matchStage: any = { chatId: new Types.ObjectId(chatId) };
    
    if (options.before) {
      const beforeDate = new Date(options.before);
      if (!isNaN(beforeDate.getTime())) {
        matchStage.timestamp = { $lt: beforeDate };
      }
    }
  
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
  
    // ✅ USE AGGREGATION to properly flatten sender information
    const messages = await Message.aggregate([
      { $match: matchStage },
      
      // Lookup sender information
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      
      // Lookup reply-to message
      {
        $lookup: {
          from: this.getMessagesCollectionName(),
          localField: 'replyToMessageId',
          foreignField: '_id',
          as: 'replyToMessage',
        },
      },
      { $unwind: { path: '$replyToMessage', preserveNullAndEmptyArrays: true } },
      
      // Lookup reply-to message sender
      {
        $lookup: {
          from: this.getUsersCollectionName(),
          localField: 'replyToMessage.senderId',
          foreignField: '_id',
          as: 'replyToMessageSender',
        },
      },
      { $unwind: { path: '$replyToMessageSender', preserveNullAndEmptyArrays: true } },
      
      // Project to flatten fields
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
          // ✅ FLATTEN sender information
          senderUsername: '$sender.username',
          senderFullName: { 
            $concat: [
              { $ifNull: ['$sender.firstname', ''] }, 
              ' ', 
              { $ifNull: ['$sender.lastname', ''] }
            ] 
          },
          // ✅ FIX: Better check for replyToMessage existence
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
                    { $ifNull: ['$replyToMessageSender.lastname', ''] }
                  ],
                },
              },
              else: null,
            },
          },
        },
      },
      
      // Sort by timestamp (ascending for chat display)
      { $sort: { timestamp: 1 } },
      
      // Limit results
      { $limit: limit },
    ]);
  
    console.log('✅ Returning', messages.length, 'messages with sender info');
    if (messages.length > 0) {
      console.log('📝 First message:', messages[0]);
    }
  
    return messages;
  }

  /**
   * Get messages by chat ID with pagination (legacy endpoint)
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
              { $ifNull: ['$sender.lastname', ''] }
            ]
          },
          // ✅ FIX: Better check for replyToMessage existence
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
                    { $ifNull: ['$replyToMessageSender.lastname', ''] }
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

    return messages;
  }

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: string, userId?: string): Promise<IMessage> {
    console.log(`📖 Marking message ${messageId} as read by user ${userId}`);
    
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
        // Ensure delivered status is set first
        const alreadyDelivered = message.deliveredTo.some((d) => d.userId.toString() === userId);
        if (!alreadyDelivered) {
          message.deliveredTo.push({
            userId: new Types.ObjectId(userId),
            deliveredAt: new Date(),
          });
        }
  
        // Add read status
        message.readBy.push({
          userId: new Types.ObjectId(userId),
          readAt: new Date(),
        });
  
        await message.save();
  
        // ✅ Emit to sender and chat room
        if (this.io) {
          const senderId = message.senderId.toString();
          const chatId = message.chatId.toString();
          
          console.log(`📡 Emitting messageRead to sender user-${senderId} and chat-${chatId}`);
          
          // Emit to sender's personal room
          this.io.to(`user-${senderId}`).emit('messageRead', {
            messageId,
            userId,
            readAt: new Date(),
            chatId,
          });
          
          // Emit to chat room
          this.io.to(`chat-${chatId}`).emit('messageRead', {
            messageId,
            userId,
            readAt: new Date(),
            chatId,
          });
        }
      } else {
        console.log(`✅ Message ${messageId} already marked as read by ${userId}`);
      }
    } else {
      await message.save();
    }
  
    return message;
  }

  /**
   * Mark all messages in a chat as read
   */
  async markChatMessagesAsRead(chatId: string, userId: string): Promise<IMessage[]> {
    console.log(`📖 Marking all messages as read in chat ${chatId} for user ${userId}`);
    
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
      console.log('✅ No unread messages to mark');
      chat.unreadCount.set(userId, 0);
      await chat.save();
      return [];
    }
  
    console.log(`📊 Marking ${unreadMessages.length} messages as read`);
  
    const readTimestamp = new Date();
    const updatedMessages: IMessage[] = [];
    
    // ✅ Track unique senders to emit events only once per sender
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
      
      // Track sender
      uniqueSenders.add(message.senderId.toString());
    }
  
    // ✅ FIX: Emit read status to ALL senders in the chat
    if (this.io) {
      uniqueSenders.forEach(senderId => {
        console.log(`📡 Emitting messageRead event to sender user-${senderId}`);
        
        // Emit to sender's personal room
        this.io?.to(`user-${senderId}`).emit('messageRead', {
          chatId,
          userId,
          readAt: readTimestamp,
          messageCount: updatedMessages.filter(m => m.senderId.toString() === senderId).length
        });
      });
      
      // ✅ Also emit to the chat room itself
      console.log(`📡 Emitting messagesRead to chat-${chatId}`);
      this.io?.to(`chat-${chatId}`).emit('messagesRead', {
        chatId,
        userId,
        readAt: readTimestamp,
        messageIds: updatedMessages.map(m => m._id.toString())
      });
    }
  
    // Reset unread count in chat
    chat.unreadCount.set(userId, 0);
    chat.markModified('unreadCount');
    await chat.save();
  
    console.log(`✅ Successfully marked ${updatedMessages.length} messages as read`);
    return updatedMessages;
  }

  /**
   * Mark message as delivered
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
   * Get messages by user ID (for incoming/sent)
   */
  async getMessagesByUserId(userId: string, field: 'senderId' | 'recipientIds'): Promise<any[]> {
    const id = new Types.ObjectId(userId);
    const matchField = field === 'recipientIds' ? 'recipientIds' : 'senderId';

    return await Message.aggregate([
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
          senderUsername: '$sender.username',
          recipientUsernames: '$recipients.username',
        },
      },
      { $sort: { timestamp: -1 } },
    ]);
  }

  /**
   * Get complete message with all populated fields
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
              { $ifNull: ['$sender.lastname', ''] }
            ]
          },
          // ✅ FIX: Better check for replyToMessage existence
          replyToMessage: {
            $cond: {
              if: { $ifNull: ['$replyToMessage._id', false] },  // ⬅️ FIXED!
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
                    { $ifNull: ['$replyToMessageSender.lastname', ''] }
                  ],
                },
              },
              else: null,
            },
          },
        },
      },
    ]);
    return messages[0] || null;
  }

  /**
   * Emit new message to all participants
   */
  // src/components/messaging/services/message.service.ts
// Update emitNewMessage method (around line 172)

private emitNewMessage(message: any, participantIds: string[]): void {
  if (!this.io) {
    console.error('❌ Socket.IO instance not available');
    return;
  }

  const uniqueParticipants = [...new Set(participantIds.map((id) => id.toString()))];
  
  const chatIdString = message.chatId.toString();

  // ✅ ADD: Log what we're emitting
  console.log('📡 Emitting newMessage event:');
  console.log('   - chatId:', chatIdString);
  console.log('   - participants:', uniqueParticipants);
  console.log('   - content:', message.content);

  // Emit to each participant's personal room
  uniqueParticipants.forEach((participantId) => {
    console.log(`📡 Emitting 'newMessage' to user-${participantId}`);
    this.io?.to(`user-${participantId}`).emit('newMessage', {
      ...message,
      _id: message._id.toString(),
      chatId: chatIdString,
      senderId: message.senderId.toString(),
      recipientIds: message.recipientIds.map((id: any) => id.toString())
    });
  });

  // Also emit to the chat room
  console.log(`📡 Emitting 'newMessage' to chat-${chatIdString}`);
  this.io?.to(`chat-${chatIdString}`).emit('newMessage', {
    ...message,
    _id: message._id.toString(),
    chatId: chatIdString,
    senderId: message.senderId.toString(),
    recipientIds: message.recipientIds.map((id: any) => id.toString())
  });
  
  console.log('✅ Message emission complete');
  }
}