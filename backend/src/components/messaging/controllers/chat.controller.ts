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
  createChat = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const payload = createChatSchema.parse(req.body);
    const chat = await this.chatService.createChat(payload);

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
  listChats = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
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

    // Format response to convert Map to object
    const result = chats.map((chat) => {
      const unreadCountObj: Record<string, number> = {};

      if (chat.unreadCount instanceof Map) {
        for (const [key, value] of chat.unreadCount) {
          unreadCountObj[key] = value;
        }
      } else if (chat.unreadCount && typeof chat.unreadCount === 'object') {
        Object.assign(unreadCountObj, chat.unreadCount);
      }

      return {
        _id: chat._id,
        participants: chat.participants,
        participantsDetails: chat.participantsDetails || [],
        lastMessageId: chat.lastMessageId,
        lastMessageContent: chat.lastMessageContent || '',
        lastMessageDate: chat.lastMessagedAt || chat.updatedAt,
        unreadCount: unreadCountObj,
        type: chat.type,
        name: chat.name,
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt,
        isStarred: chat.isStarred || false,
        isPinned: chat.isPinned || false,
        isMuted: chat.isMuted || false,
        isArchived: chat.isArchived || false,
      };
    });

    res.json(result);
  });

  /**
 * GET /messaging/chats/:chatId
 * Get a single chat by ID
 */
  getChatById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ErrorResponse('Invalid chat ID', StatusCodes.BAD_REQUEST);
    }

    const chat = await this.chatService.getChatById(chatId);

    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }

    // Format response to convert Map to object
    const unreadCountObj: Record<string, number> = {};
    if (chat.unreadCount instanceof Map) {
      for (const [key, value] of chat.unreadCount) {
        unreadCountObj[key] = value;
      }
    } else if (chat.unreadCount && typeof chat.unreadCount === 'object') {
      Object.assign(unreadCountObj, chat.unreadCount);
    }

    const formattedChat = {
      _id: chat._id,
      participants: chat.participants,
      participantsDetails: chat.participantsDetails || [],
      lastMessageId: chat.lastMessageId,
      lastMessageContent: chat.lastMessageContent || '',
      lastMessageDate: chat.lastMessagedAt || chat.updatedAt,
      unreadCount: unreadCountObj,
      type: chat.type,
      name: chat.name,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
      isStarred: chat.isStarred || false,
      isPinned: chat.isPinned || false,
      isMuted: chat.isMuted || false,
      isArchived: chat.isArchived || false,
    };

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: formattedChat,
    });
  });


  /**
   * POST /messaging/chats/:chatId/reset-unread
   * Reset unread count for a user in a chat
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
   * Update chat properties (including user-specific settings)
   */
  updateChatSettings = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const updates = req.body; // ✅ SIMPLIFIED: No need to extract userId
  
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ErrorResponse('Invalid chat ID', StatusCodes.BAD_REQUEST);
    }
  
    console.log('📝 Updating chat:', chatId, 'updates:', updates);
  
    // ✅ SIMPLIFIED: Pass updates directly, no userId needed
    const chat = await this.chatService.updateChat(chatId, updates);
  
    if (!chat) {
      throw new ErrorResponse('Chat not found', StatusCodes.NOT_FOUND);
    }
  
    // Format response
    const unreadCountObj: Record<string, number> = {};
    if (chat.unreadCount instanceof Map) {
      for (const [key, value] of chat.unreadCount) {
        unreadCountObj[key] = value;
      }
    } else if (chat.unreadCount && typeof chat.unreadCount === 'object') {
      Object.assign(unreadCountObj, chat.unreadCount);
    }
  
    // ✅ SIMPLIFIED: Just return global settings
    const formattedChat = {
      _id: chat._id,
      participants: chat.participants,
      participantsDetails: chat.participantsDetails || [],
      lastMessageId: chat.lastMessageId,
      lastMessageContent: chat.lastMessageContent || '',
      lastMessageDate: chat.lastMessagedAt || chat.updatedAt,
      unreadCount: unreadCountObj,
      type: chat.type,
      name: chat.name,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
      isStarred: chat.isStarred,
      isPinned: chat.isPinned,
      isMuted: chat.isMuted,
      isArchived: chat.isArchived,
    };
  
    res.json(formattedChat);
  });

  /**
   * DELETE /messaging/chats/:chatId
   * Delete a chat and all its messages
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
}