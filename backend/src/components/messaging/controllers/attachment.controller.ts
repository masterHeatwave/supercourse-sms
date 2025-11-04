// src/components/messaging/controllers/attachment.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/async';
import { StatusCodes } from 'http-status-codes';
import { ErrorResponse } from '@utils/errorResponse';
import { AttachmentService } from '../services/attachment.service';
import { AttachmentStatus, VirusScanStatus } from '../messaging.interface';

export class AttachmentController {
  private attachmentService: AttachmentService;

  constructor(attachmentService: AttachmentService) {
    this.attachmentService = attachmentService;
  }

  /**
   * POST /messaging/attachments/upload
   * Upload files to a chat or message
   */
  uploadAttachments = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, messageId } = req.body;
    const userId = (req as any).user?.id || req.body.userId;
    const files = (req as any).files as Express.Multer.File[];

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    if (!chatId) {
      throw new ErrorResponse('Chat ID is required', StatusCodes.BAD_REQUEST);
    }

    if (!files || files.length === 0) {
      throw new ErrorResponse('No files provided', StatusCodes.BAD_REQUEST);
    }

    const result = await this.attachmentService.uploadAttachments(files, chatId, userId, messageId);

    if (result.attachments.length === 0) {
      throw new ErrorResponse('Failed to process any files', StatusCodes.BAD_REQUEST);
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `${result.attachments.length} file(s) are being processed`,
      attachments: result.attachments,
      processing: true,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  });

  /**
   * GET /messaging/attachments/chat/:chatId
   * Get all attachments for a chat
   */
  getChatAttachments = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { limit = 50 } = req.query;

    const attachments = await this.attachmentService.getChatAttachments(chatId, parseInt(limit as string));

    res.status(StatusCodes.OK).json({
      success: true,
      count: attachments.length,
      attachments,
    });
  });

  /**
   * GET /messaging/attachments/message/:messageId
   * Get all attachments for a message
   */
  getMessageAttachments = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;

    const attachments = await this.attachmentService.getMessageAttachments(messageId);

    res.status(StatusCodes.OK).json({
      success: true,
      count: attachments.length,
      attachments,
    });
  });

  /**
   * GET /messaging/attachments/:id
   * Get single attachment by ID
   */
  getAttachmentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const attachment = await this.attachmentService.getAttachmentById(id);

    res.status(StatusCodes.OK).json({
      success: true,
      attachment,
    });
  });

  /**
   * GET /messaging/attachments/:id/download
   * Download/redirect to attachment URL
   */
  downloadAttachment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const attachment = await this.attachmentService.getAttachmentById(id);

    if (attachment.status !== AttachmentStatus.READY) {
      throw new ErrorResponse('File is not ready for download', StatusCodes.FORBIDDEN);
    }

    if (attachment.virusScanStatus === VirusScanStatus.INFECTED) {
      throw new ErrorResponse('File failed virus scan and cannot be downloaded', StatusCodes.FORBIDDEN);
    }

    if (!attachment.url) {
      throw new ErrorResponse('File URL not found', StatusCodes.NOT_FOUND);
    }

    console.log(`Redirecting download to: ${attachment.url}`);
    res.redirect(attachment.url);
  });

  /**
   * DELETE /messaging/attachments/:id
   * Delete an attachment
   */
  deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    await this.attachmentService.deleteAttachment(id, userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  });

  /**
   * POST /messaging/attachments/status
   * Get upload status for multiple attachments
   */
  getUploadStatus = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      throw new ErrorResponse('User ID is required', StatusCodes.BAD_REQUEST);
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ErrorResponse('Invalid attachment IDs provided', StatusCodes.BAD_REQUEST);
    }

    const statuses = await this.attachmentService.getUploadStatus(ids, userId);

    res.status(StatusCodes.OK).json({
      success: true,
      statuses,
    });
  });
}