// src/components/messaging/services/chat.service.ts
import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import Chat from '../models/chat.model';
import Message from '../models/message.model';
import User from '@components/users/user.model';
import {
  IChat,
  ICreateChatDTO,
  ChatType,
} from '../messaging.interface';
import { Server as SocketIOServer } from 'socket.io';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

export class ChatService {
  private io: SocketIOServer | null = null;


  /**
   * Set Socket.IO instance for real-time updates
   */
  setSocketIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
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
   * List chats, optionally filtered by participant
   */
  async listChats(participant?: string): Promise<IChat[]> {
    let query = Chat.find().sort({ lastMessagedAt: -1 });

    if (participant) {
      query = query.where('participants').in([participant]);
    }

    return await query.populate('participants', 'firstname lastname email avatar username').exec();
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string): Promise<any> {
    try {
      const chats = await Chat.aggregate([
        { $match: { _id: new Types.ObjectId(chatId) } },
        {
          $lookup: {
            from: this.getUsersCollectionName(),
            localField: 'participants',
            foreignField: '_id',
            as: 'participantsDetails',
          },
        },
        {
          $project: {
            _id: 1,
            participants: 1,
            lastMessageId: 1,
            lastMessageContent: 1,
            lastMessagedAt: 1,
            unreadCount: 1,
            type: 1,
            name: 1,
            createdAt: 1,
            updatedAt: 1,
            isStarred: 1,
            isPinned: 1,
            isMuted: 1,
            isArchived: 1,
            userSettings: 1,
            participantsDetails: {
              $map: {
                input: '$participantsDetails',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  userId: '$$user._id',
                  username: '$$user.username',
                  email: '$$user.email',
                  firstname: '$$user.firstname',
                  lastname: '$$user.lastname',
                  userType: '$$user.user_type',
                  isOnline: '$$user.isOnline',
                  lastSeen: '$$user.lastSeen',
                  avatar: '$$user.avatar',
                  displayName: {
                    $let: {
                      vars: {
                        usernameParts: { $split: ['$$user.username', '@'] },
                      },
                      in: { $arrayElemAt: ['$$usernameParts', 0] },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      if (!chats || chats.length === 0) {
        throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
      }

      return chats[0];
    } catch (error: any) {
      console.error('❌ Error getting chat by ID:', error);
      throw error;
    }
  }

  /**
   * Get all chats for a user with populated participant details
   */
  async getUserChats(userId: string): Promise<any[]> {
    try {
  
      const chats = await Chat.aggregate([
        { $match: { participants: new Types.ObjectId(userId) } },
        
        {
          $lookup: {
            from: this.getMessagesCollectionName(),
            localField: 'lastMessageId',
            foreignField: '_id',
            as: 'lastMessage'
          }
        },
        { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
        
        {
          $lookup: {
            from: this.getUsersCollectionName(),
            localField: 'participants',
            foreignField: '_id',
            as: 'participantsDetails',
          },
        },
        {
          $project: {
            _id: 1,
            participants: 1,
            lastMessageId: 1,
            lastMessageContent: {
              $ifNull: ['$lastMessage.content', '$lastMessageContent']
            },
            lastMessagedAt: 1,
            unreadCount: 1,
            type: 1,
            name: 1,
            createdAt: 1,
            updatedAt: 1,
            isStarred: 1,
            isPinned: 1,
            isMuted: 1,
            isArchived: 1,
            participantsDetails: {
              $map: {
                input: '$participantsDetails',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  userId: '$$user._id',
                  username: '$$user.username',
                  email: '$$user.email',
                  firstname: '$$user.firstname',
                  lastname: '$$user.lastname',
                  userType: '$$user.user_type',
                  isOnline: '$$user.isOnline',
                  lastSeen: '$$user.lastSeen',
                  avatar: '$$user.avatar',
                  displayName: {
                    $let: {
                      vars: {
                        usernameParts: { $split: ['$$user.username', '@'] },
                      },
                      in: { $arrayElemAt: ['$$usernameParts', 0] },
                    },
                  },
                },
              },
            },
          },
        },
        { $sort: { lastMessagedAt: -1 } },
      ]);
  
      return chats;

    } catch (error: any) {
      console.error('❌ Error in getUserChats:', error);
      throw new ErrorResponse(`Failed to get user chats: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create or get existing chat (with forceNew option)
   */
  async createOrGetChat(
    participants: string[],
    type: ChatType = ChatType.DIRECT,
    name: string = '',
    forceNew: boolean = false
  ): Promise<any> {
    try {

      const participantObjectIds = participants.map((id) => new Types.ObjectId(id));

      if (!forceNew) {
        const matchQuery: any = {
          participants: {
            $all: participantObjectIds,
            $size: participantObjectIds.length,
          },
          type,
        };

        if (type === ChatType.GROUP && name) {
          matchQuery.name = name;
        }

        const existingChats = await Chat.aggregate([
          { $match: matchQuery },
          {
            $lookup: {
              from: this.getUsersCollectionName(),
              localField: 'participants',
              foreignField: '_id',
              as: 'participantsDetails',
            },
          },
          {
            $project: {
              _id: 1,
              participants: 1,
              lastMessageId: 1,
              lastMessageContent: 1,
              lastMessagedAt: 1,
              unreadCount: 1,
              type: 1,
              name: 1,
              createdAt: 1,
              updatedAt: 1,
              participantsDetails: {
                $map: {
                  input: '$participantsDetails',
                  as: 'user',
                  in: {
                    _id: '$$user._id',
                    userId: '$$user._id',
                    username: '$$user.username',
                    email: '$$user.email',
                    firstname: '$$user.firstname',
                    lastname: '$$user.lastname',
                    userType: '$$user.user_type',
                    isOnline: '$$user.isOnline',
                    lastSeen: '$$user.lastSeen',
                    avatar: '$$user.avatar',
                    displayName: {
                      $let: {
                        vars: {
                          usernameParts: { $split: ['$$user.username', '@'] },
                        },
                        in: { $arrayElemAt: ['$$usernameParts', 0] },
                      },
                    },
                  },
                },
              },
            },
          },
        ]);

        if (existingChats.length > 0) {
          return existingChats[0];
        }
      }

      const chatData: any = {
        participants: participantObjectIds,
        type,
        name: type === ChatType.GROUP ? name : '',
        unreadCount: new Map(),
        lastMessageContent: '',
        lastMessagedAt: new Date(),
      };

      participants.forEach((participantId) => {
        chatData.unreadCount.set(participantId, 0);
      });

      const chat = await Chat.create(chatData);

      const populatedChats = await Chat.aggregate([
        { $match: { _id: chat._id } },
        {
          $lookup: {
            from: this.getUsersCollectionName(),
            localField: 'participants',
            foreignField: '_id',
            as: 'participantsDetails',
          },
        },
        {
          $project: {
            _id: 1,
            participants: 1,
            lastMessageId: 1,
            lastMessageContent: 1,
            lastMessagedAt: 1,
            unreadCount: 1,
            type: 1,
            name: 1,
            createdAt: 1,
            updatedAt: 1,
            participantsDetails: {
              $map: {
                input: '$participantsDetails',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  userId: '$$user._id',
                  username: '$$user.username',
                  email: '$$user.email',
                  firstname: '$$user.firstname',
                  lastname: '$$user.lastname',
                  userType: '$$user.user_type',
                  isOnline: '$$user.isOnline',
                  lastSeen: '$$user.lastSeen',
                  avatar: '$$user.avatar',
                  displayName: {
                    $let: {
                      vars: {
                        usernameParts: { $split: ['$$user.username', '@'] },
                      },
                      in: { $arrayElemAt: ['$$usernameParts', 0] },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return populatedChats[0];
    } catch (error: any) {
      console.error('❌ Error in createOrGetChat:', error);
      throw new ErrorResponse(`Failed to create or get chat: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reset unread count for a user in a chat
   */
  async resetUnreadCount(chatId: string, userId: string): Promise<IChat> {
    try {

      const chat = await Chat.findById(chatId);
        if (!chat) {
          throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
      }

      const userIdStr = userId.toString();

      if (!chat.unreadCount) {
        chat.unreadCount = new Map();
      }

      chat.unreadCount.set(userIdStr, 0);
      chat.markModified('unreadCount');
      chat.updatedAt = new Date();

      await chat.save();

      return chat;
    } catch (error: any) {
      console.error('❌ Error resetting unread count:', error);
      throw error;
    }
  }

    /**
   * Update chat properties (including user-specific settings)
   * ✅ FIXED: Properly handles Mongoose subdocuments
   */
    async updateChat(chatId: string, updates: any, userId?: string): Promise<any> {
      try {
    
        const chat = await Chat.findById(chatId);
        if (!chat) {
          throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
        }
    
        // Update the fields
        Object.keys(updates).forEach((key) => {
          if (key !== 'userId') {
            (chat as any)[key] = updates[key];
          }
        });
    
        chat.updatedAt = new Date();
        
        await chat.save();
  
    
        // ✅ FIX: Use aggregate to get full chat with participantsDetails
        const populatedChats = await Chat.aggregate([
          { $match: { _id: chat._id } },
          {
            $lookup: {
              from: this.getUsersCollectionName(),
              localField: 'participants',
              foreignField: '_id',
              as: 'participantsDetails',
            },
          },
          {
            $project: {
              _id: 1,
              participants: 1,
              lastMessageId: 1,
              lastMessageContent: 1,
              lastMessagedAt: 1,
              unreadCount: 1,
              type: 1,
              name: 1,
              createdAt: 1,
              updatedAt: 1,
              isStarred: 1,
              isPinned: 1,
              isMuted: 1,
              isArchived: 1,
              participantsDetails: {
                $map: {
                  input: '$participantsDetails',
                  as: 'user',
                  in: {
                    _id: '$$user._id',
                    userId: '$$user._id',
                    username: '$$user.username',
                    email: '$$user.email',
                    firstname: '$$user.firstname',
                    lastname: '$$user.lastname',
                    userType: '$$user.user_type',
                    isOnline: '$$user.isOnline',
                    lastSeen: '$$user.lastSeen',
                    avatar: '$$user.avatar',
                    displayName: {
                      $let: {
                        vars: {
                          usernameParts: { $split: ['$$user.username', '@'] },
                        },
                        in: { $arrayElemAt: ['$$usernameParts', 0] },
                      },
                    },
                  },
                },
              },
            },
          },
        ]);
    
        if (!populatedChats || populatedChats.length === 0) {
          throw new ErrorResponse('Failed to retrieve updated chat', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    
        const chatData = populatedChats[0];
    
        // Convert Map to plain object for unreadCount
        const unreadCountObj: Record<string, number> = {};
        if (chatData.unreadCount && typeof chatData.unreadCount === 'object') {
          Object.assign(unreadCountObj, chatData.unreadCount);
        }
    
        // Build response
        const response = {
          _id: chatData._id,
          participants: chatData.participants,
          participantsDetails: chatData.participantsDetails || [],
          lastMessageId: chatData.lastMessageId,
          lastMessageContent: chatData.lastMessageContent || '',
          lastMessagedAt: chatData.lastMessagedAt,
          unreadCount: unreadCountObj,
          type: chatData.type,
          name: chatData.name,
          createdAt: chatData.createdAt,
          updatedAt: chatData.updatedAt,
          isStarred: chatData.isStarred,
          isPinned: chatData.isPinned,
          isMuted: chatData.isMuted,
          isArchived: chatData.isArchived,
        };
    
        // ✅ Emit the FULL updated chat to all participants via Socket.IO
        if (this.io) {
          chat.participants.forEach((participantId: Types.ObjectId) => {
            const participantIdStr = participantId.toString();
            this.io?.to(`user-${participantIdStr}`).emit('chatUpdated', {
              chatId: response._id,
              ...response  // Send the FULL chat object
            });
          });
        }
    
        return response;
      } catch (error: any) {
        console.error('❌ Error updating chat:', error);
        throw new ErrorResponse(`Failed to update chat: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }

  /**
   * Delete a chat and all its messages
   */
  async deleteChat(chatId: string): Promise<IChat> {
    try {

      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
      }
      const deletedMessages = await Message.deleteMany({
        chatId: new Types.ObjectId(chatId),
      });

      const deletedChat = await Chat.findByIdAndDelete(chatId);

      if (!deletedChat) {
        throw new ErrorResponse('Chat could not be deleted', StatusCodes.INTERNAL_SERVER_ERROR);
      }

      if (this.io) {
        deletedChat.participants.forEach((participantId: Types.ObjectId) => {
          this.io?.to(participantId.toString()).emit('chatDeleted', {
            chatId: deletedChat._id,
          });
        });
      }

      return deletedChat;
    } catch (error: any) {
      console.error('❌ Error deleting chat:', error);
      throw new ErrorResponse(`Failed to delete chat: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getChatWithSessions(taxiId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(taxiId)) {
        throw new ErrorResponse('Invalid taxi ID format', StatusCodes.BAD_REQUEST);
      }
  
      const chats = await Chat.aggregate([
        { $match: { taxiId: new Types.ObjectId(taxiId), type: 'group' } },
        {
          $lookup: {
            from: this.getUsersCollectionName(),
            localField: 'participants',
            foreignField: '_id',
            as: 'participantsDetails',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            taxiId: 1,
            sessions: 1,
            classMetadata: 1,
            participants: 1,
            participantsDetails: 1,
            lastMessageContent: 1,
            lastMessagedAt: 1,
          },
        },
      ]);
  
      if (!chats.length) {
        throw new ErrorResponse('Class chat not found', StatusCodes.NOT_FOUND);
      }
  
      return chats[0];
    } catch (error: any) {
      console.error('❌ Error in getChatWithSessions:', error);
      throw error;
    }
  }
  

  async getChatByTaxiId(taxiId: string): Promise<any> {
    try {
  
      // Validate input
      if (!taxiId) {
        throw new ErrorResponse('Taxi ID is required', StatusCodes.BAD_REQUEST);
      }
  
      if (!Types.ObjectId.isValid(taxiId)) {
        console.warn('⚠️ Invalid taxiId format:', taxiId);
        throw new ErrorResponse('Invalid taxi ID format', StatusCodes.BAD_REQUEST);
      }
  
      // Use simple findOne first for efficiency
      const chat = await Chat.findOne({
        taxiId: new Types.ObjectId(taxiId),
        type: 'group',
      }).populate('participants', 'firstname lastname email avatar username isOnline lastSeen');
  
      if (!chat) {
        console.warn('⚠️ No class chat found for taxi:', taxiId);
        throw new ErrorResponse('Class chat not found', StatusCodes.NOT_FOUND);
      }

  
      // Now populate with aggregation for full details
      const fullChats = await Chat.aggregate([
        { $match: { _id: chat._id } },
        {
          $lookup: {
            from: this.getUsersCollectionName(),
            localField: 'participants',
            foreignField: '_id',
            as: 'participantsDetails',
          },
        },
        {
          $project: {
            _id: 1,
            participants: 1,
            type: 1,
            name: 1,
            taxiId: 1,
            sessions: 1,
            classMetadata: 1,
            lastMessageContent: 1,
            lastMessagedAt: 1,
            unreadCount: 1,
            isStarred: 1,
            isPinned: 1,
            isMuted: 1,
            isArchived: 1,
            createdAt: 1,
            updatedAt: 1,
            participantsDetails: {
              $map: {
                input: '$participantsDetails',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  userId: '$$user._id',
                  username: '$$user.username',
                  email: '$$user.email',
                  firstname: '$$user.firstname',
                  lastname: '$$user.lastname',
                  userType: '$$user.user_type',
                  isOnline: '$$user.isOnline',
                  lastSeen: '$$user.lastSeen',
                  avatar: '$$user.avatar',
                  displayName: {
                    $let: {
                      vars: {
                        usernameParts: { $split: ['$$user.username', '@'] },
                      },
                      in: { $arrayElemAt: ['$$usernameParts', 0] },
                    },
                  },
                },
              },
            },
          },
        },
      ]);
  
      if (!fullChats || fullChats.length === 0) {
        throw new ErrorResponse('Failed to populate chat details', StatusCodes.INTERNAL_SERVER_ERROR);
      }
  
      return fullChats[0];
    } catch (error: any) {
      console.error('❌ [ChatService] Error in getChatByTaxiId:', {
        error: error.message,
        taxiId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Emit chat update to all participants
   */
  emitChatUpdate(chatId: string, chat: IChat): void {
    if (!this.io) return;

    chat.participants.forEach((participantId: Types.ObjectId) => {
      this.io?.to(participantId.toString()).emit('chatUpdate', {
        chatId,
        chat,
      });
    });
  }
}