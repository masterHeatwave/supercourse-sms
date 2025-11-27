// src/components/messaging/controllers/chat.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ErrorResponse } from '@utils/errorResponse';
import { ChatService } from '../services/chat.service';
import { createChatSchema } from '../messaging-validate.schema';

export class ChatController {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  /**
   * Create a new chat
   * POST /messaging/chats
   */
  createChat = asyncHandler(async (req: Request, res: Response) => {
    const payload = createChatSchema.parse(req.body);
  
    const chat = await this.chatService.createOrGetChat(
      payload.participants,
      payload.type,
      payload.name,
      true   // force new if needed
    );
  
    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: chat,
    });
  });

  /**
   * List chats
   * GET /messaging/chats
   */
  listChats = asyncHandler(async (req: Request, res: Response) => {
    const participant = (req.query.participant as string) || undefined;
    const chats = await this.chatService.listChats(participant);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: chats.length,
      data: chats,
    });
  });

  /**
   * GET /messaging/chats/participants/:userId
   * Get all chats for a user
   */
  getChatsByUserId = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('Invalid user ID', StatusCodes.BAD_REQUEST);
    }

    const chats = await this.chatService.getUserChats(userId);

    // Map → object conversion
    const formatted = chats.map((chat) => {
      const unreadObj: Record<string, number> = {};

      if (chat.unreadCount instanceof Map) {
        for (const [key, value] of chat.unreadCount) unreadObj[key] = value;
      } else if (chat.unreadCount) {
        Object.assign(unreadObj, chat.unreadCount);
      }

      return {
        _id: chat._id,
        participants: chat.participants,
        participantsDetails: chat.participantsDetails || [],
        lastMessageId: chat.lastMessageId,
        lastMessageContent: chat.lastMessageContent || '',
        lastMessageDate: chat.lastMessagedAt || chat.updatedAt,
        unreadCount: unreadObj,
        type: chat.type,
        name: chat.name,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isStarred: chat.isStarred || false,
        isPinned: chat.isPinned || false,
        isMuted: chat.isMuted || false,
        isArchived: chat.isArchived || false,
      };
    });

    res.json(formatted);
  });

  /**
   * GET /messaging/chats/:chatId
   * Get a single chat by ID
   */
  getChatById = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ErrorResponse('Invalid chat ID', StatusCodes.BAD_REQUEST);
    }

    const chat = await this.chatService.getChatById(chatId);

    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }

    const unreadObj: Record<string, number> = {};
    if (chat.unreadCount instanceof Map) {
      for (const [key, value] of chat.unreadCount) unreadObj[key] = value;
    } else if (chat.unreadCount) {
      Object.assign(unreadObj, chat.unreadCount);
    }

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {
        _id: chat._id,
        participants: chat.participants,
        participantsDetails: chat.participantsDetails || [],
        lastMessageId: chat.lastMessageId,
        lastMessageContent: chat.lastMessageContent || "",
        lastMessageDate: chat.lastMessagedAt || chat.updatedAt,
        unreadCount: unreadObj,
        type: chat.type,
        name: chat.name,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isStarred: chat.isStarred || false,
        isPinned: chat.isPinned || false,
        isMuted: chat.isMuted || false,
        isArchived: chat.isArchived || false,
      },
    });
  });

  /**
   * POST /messaging/chats/:chatId/reset-unread
   * Reset unread count for a user
   */
  resetUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ErrorResponse('Invalid chat ID', StatusCodes.BAD_REQUEST);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('Invalid user ID', StatusCodes.BAD_REQUEST);
    }

    await this.chatService.resetUnreadCount(chatId, userId);

    res.json({
      success: true,
      message: 'Unread count reset',
      data: { chatId, userId },
    });
  });

  /**
   * PATCH /messaging/chats/:chatId
   * Update chat properties (global or user-specific)
   */
  updateChatSettings = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ErrorResponse('Invalid chat ID', StatusCodes.BAD_REQUEST);
    }

    const chat = await this.chatService.updateChat(chatId, updates);

    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }

    const unreadObj: Record<string, number> = {};
    if (chat.unreadCount instanceof Map) {
      for (const [key, value] of chat.unreadCount) unreadObj[key] = value;
    } else if (chat.unreadCount) {
      Object.assign(unreadObj, chat.unreadCount);
    }

    res.json({
      _id: chat._id,
      participants: chat.participants,
      participantsDetails: chat.participantsDetails || [],
      lastMessageId: chat.lastMessageId,
      lastMessageContent: chat.lastMessageContent || '',
      lastMessageDate: chat.lastMessagedAt || chat.updatedAt,
      unreadCount: unreadObj,
      type: chat.type,
      name: chat.name,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      isStarred: chat.isStarred,
      isPinned: chat.isPinned,
      isMuted: chat.isMuted,
      isArchived: chat.isArchived,
    });
  });

  /**
   * DELETE /messaging/chats/:chatId
   * Delete a chat
   */
  deleteChatById = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ErrorResponse('Invalid chat ID', StatusCodes.BAD_REQUEST);
    }

    const deletedChat = await this.chatService.deleteChat(chatId);

    res.json({
      success: true,
      message: 'Chat deleted successfully',
      data: { chatId: deletedChat._id },
    });
  });

  /**
   * GET /messaging/chats/class/:taxiId
   * Get class group chat by taxi ID
   */
  getChatByTaxiId = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { taxiId } = req.params;
  
      console.log('📨 [ChatController] getChatByTaxiId called with:', taxiId);
  
      if (!taxiId) {
        throw new ErrorResponse('Taxi ID is required', StatusCodes.BAD_REQUEST);
      }
  
      // Call service
      const chat = await this.chatService.getChatByTaxiId(taxiId);
  
      if (!chat) {
        throw new ErrorResponse('Class chat not found', StatusCodes.NOT_FOUND);
      }
  
      // Convert unreadCount Map to object if needed
      const unreadObj: Record<string, number> = {};
      if (chat.unreadCount instanceof Map) {
        for (const [key, value] of chat.unreadCount) {
          unreadObj[key] = value;
        }
      } else if (chat.unreadCount) {
        Object.assign(unreadObj, chat.unreadCount);
      }
  
      const response = {
        _id: chat._id,
        participants: chat.participants,
        participantsDetails: chat.participantsDetails || [],
        type: chat.type,
        name: chat.name,
        taxiId: chat.taxiId,
        sessions: chat.sessions || [],
        classMetadata: chat.classMetadata || {},
        lastMessageContent: chat.lastMessageContent || '',
        lastMessagedAt: chat.lastMessagedAt,
        unreadCount: unreadObj,
        isStarred: chat.isStarred || false,
        isPinned: chat.isPinned || false,
        isMuted: chat.isMuted || false,
        isArchived: chat.isArchived || false,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
  
      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: response,
      });
    } catch (error: any) {
      console.error('❌ [ChatController] Error:', error.message);
      
      if (error.message.includes('Taxi ID is required')) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: { type: 'VALIDATION_ERROR', message: error.message },
        });
      }
      
      if (error.message.includes('not found')) {
        return jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: { type: 'NOT_FOUND', message: error.message },
        });
      }
  
      throw error; // Pass to error middleware
    }
  });

  /**
   * GET /messaging/chats/:chatId/with-sessions
   * Get chat with full session population
   */
  getChatWithSessions = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    if (!chatId) {
      throw new ErrorResponse('Chat ID is required', StatusCodes.BAD_REQUEST);
    }

    const chat = await this.chatService.getChatByTaxiId(chatId);

    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: chat,
    });
  });
}
