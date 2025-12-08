// src/components/messaging/controllers/message.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { MessageService } from '../services/message.service';
import {
  queryMessagesSchema,
  sendMessageSchema,
  markAsDeliveredSchema,
  markAsReadSchema,
  markChatAsReadSchema,
} from '../messaging-validate.schema';
import mongoose from 'mongoose';

export class MessageController {
  private messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  /**
   * Send a message
   * POST /messaging/messages
   */
  sendMessage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const payload = sendMessageSchema.parse(req.body);

      const message = await this.messageService.sendMessage(payload);

      jsonResponse(res, {
        status: StatusCodes.CREATED,
        success: true,
        data: message,
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  });

  /**
   * Get messages in a chat
   * GET /messaging/messages
   */
  getMessages = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { chatId, limit, before } = queryMessagesSchema.parse(req.query);
    const messages = await this.messageService.getMessages(chatId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      before,
    });

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: messages.length,
      data: messages,
    });
  });

  /**
   * Get messages by chat ID (legacy endpoint with pagination)
   * GET /messaging/chats/:chatId/messages
   */
  getMessagesByChatId = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(1000, parseInt(req.query.limit as string) || 50);

      const messages = await this.messageService.getMessagesByChatId(chatId, page, limit);

      res.json({
        messages,
        pagination: {
          page,
          limit: limit > 0 ? limit : false,
          hasMore: limit > 0 && messages.length === limit,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching messages by chatId:', error);
      throw error;
    }
  });

  /**
   * Mark a message as read
   * PATCH /messaging/messages/:id/read
   */
  markRead = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user?._id?.toString() || req.body.userId;
    const message = await this.messageService.markMessageRead(req.params.id, userId);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: message,
    });
  });

  /**
   * Mark all messages in a chat as read
   * POST /messaging/chats/:chatId/read
   */
  markChatAsRead = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const { userId } = markChatAsReadSchema.parse({ chatId, ...req.body });
  
      const updatedMessages = await this.messageService.markChatMessagesAsRead(chatId, userId);
  
      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        message: 'Chat messages marked as read',
        data: {
          updatedCount: updatedMessages.length,
        },
      });
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);
      throw error;
    }
  });
  

  /**
   * Mark message as delivered
   * POST /messaging/messages/:messageId/delivered
   */
  markAsDelivered = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const { userId } = markAsDeliveredSchema.parse({ messageId, ...req.body });

      const updatedMessage = await this.messageService.markAsDelivered(messageId, userId);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        message: 'Message marked as delivered',
        data: {
          messageId: updatedMessage._id,
          deliveredTo: updatedMessage.deliveredTo,
        },
      });
    } catch (error) {
      console.error('❌ Error marking message as delivered:', error);
      throw error;
    }
  });

  /**
   * Update read status (individual message - alternative endpoint)
   * PATCH /messaging/messages/:messageId/read
   */
  updateReadStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const { userId } = markAsReadSchema.parse({ messageId, ...req.body });

      const updatedMessage = await this.messageService.markMessageRead(messageId, userId);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        message: 'Read status updated successfully',
        data: {
          messageId: updatedMessage._id,
          readBy: updatedMessage.readBy,
        },
      });
    } catch (error) {
      console.error('❌ Error updating read status:', error);
      throw error;
    }
  });

  /**
   * Delete a message
   * DELETE /messaging/messages/:messageId
   */
  deleteMessage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.body?.userId || req.query?.userId || req.user?._id?.toString() || undefined;

      const deletedMessage = await this.messageService.deleteMessage(messageId, userId as string | undefined);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        message: 'Message deleted successfully',
        data: {
          messageId: deletedMessage._id,
          chatId: deletedMessage.chatId,
        },
      });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  });

  /**
   * Get incoming messages for a user
   * GET /messaging/incoming/:userId
   */
  getIncomingMessages = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

      const messages = await this.messageService.getMessagesByUserId(userId, 'recipientIds');

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = messages.slice(startIndex, endIndex);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: {
          messages: paginatedMessages,
          pagination: {
            page,
            limit,
            hasMore: endIndex < messages.length,
            total: messages.length,
          },
        },
      });
    } catch (error) {
      console.error('❌ Error fetching incoming messages:', error);
      throw error;
    }
  });

  /**
   * Get sent messages for a user
   * GET /messaging/sent/:userId
   */
  getSentMessages = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

      const messages = await this.messageService.getMessagesByUserId(userId, 'senderId');

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = messages.slice(startIndex, endIndex);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: {
          messages: paginatedMessages,
          pagination: {
            page,
            limit,
            hasMore: endIndex < messages.length,
            total: messages.length,
          },
        },
      });
    } catch (error) {
      console.error('❌ Error fetching sent messages:', error);
      throw error;
    }
  });
}