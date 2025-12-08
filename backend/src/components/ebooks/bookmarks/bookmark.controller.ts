import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { BookmarkService } from './bookmark.service';
import { getBookmarksSchema, updateBookmarksSchema } from './bookmark-validate.schema';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class BookmarkController {
  private bookmarkService: BookmarkService;

  constructor() {
    this.bookmarkService = new BookmarkService();
  }

  getBookmarks = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, appId } = getBookmarksSchema.parse({ userId: req.user._id.toString(), appId: req.params.appId });
      const result = await this.bookmarkService.getBookmarks(userId, appId);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });

  updateBookmarks = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, appId, items } = updateBookmarksSchema.parse({
        userId: req.user._id.toString(),
        appId: req.params.appId,
        items: req.body,
      });
      await this.bookmarkService.updateBookmarks(userId, appId, items);
      return res.status(204).end();
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });
}
