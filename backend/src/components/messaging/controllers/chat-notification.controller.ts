// src/components/messaging/controllers/chat-notification.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/async';
import { StatusCodes } from 'http-status-codes';
import { ErrorResponse } from '@utils/errorResponse';
import { ChatNotificationService } from '../services/chat-notification.service';

export class ChatNotificationController {
  private notificationService: ChatNotificationService;

  constructor(notificationService: ChatNotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * GET /messaging/notifications
   * Get notifications for current user with pagination
   */
  getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.query.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const result = await this.notificationService.getUserNotifications(userId as string, page, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /messaging/notifications/unread/count
   * Get unread notifications count
   */
  getUnreadNotificationCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.query.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const count = await this.notificationService.getUnreadNotificationCount(userId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      count,
    });
  });

  /**
   * PATCH /messaging/notifications/:id/read
   * Mark single notification as read
   */
  markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const notification = await this.notificationService.markNotificationAsRead(id, userId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      data: notification,
    });
  });

  /**
   * POST /messaging/notifications/read/all
   * Mark all notifications as read
   */
  markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const result = await this.notificationService.markAllNotificationsAsRead(userId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  });

  /**
   * DELETE /messaging/notifications/:id
   * Soft delete a notification
   */
  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const notification = await this.notificationService.deleteNotification(id, userId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      data: notification,
    });
  });

  /**
   * POST /messaging/notifications/clear
   * Clear all notifications for user
   */
  clearAllNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const result = await this.notificationService.clearAllNotifications(userId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /messaging/notifications/type/:type
   * Get notifications by type
   */
  getNotificationsByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const userId = (req as any).user?.id || req.query.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    const result = await this.notificationService.getNotificationsByType(
      userId as string,
      type as any,
      page,
      limit
    );

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  });

  /**
   * POST /messaging/notifications/system
   * Create system notification (admin only)
   */
  createSystemNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userIds, title, content } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new ErrorResponse('User IDs array is required', StatusCodes.BAD_REQUEST);
    }

    if (!title || !content) {
      throw new ErrorResponse('Title and content are required', StatusCodes.BAD_REQUEST);
    }

    const notifications = await this.notificationService.createSystemNotification(userIds, title, content);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: notifications,
    });
  });
  createWelcomeNotification = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.body.userId;
  
    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }
  
    const notification = await this.notificationService.createWelcomeNotification(userId as string);
  
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: notification,
    });
  });
}