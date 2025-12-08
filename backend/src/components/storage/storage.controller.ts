import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { NextFunction, Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StorageFilesSchema, StorageUploadSchema } from '@components/storage/storage-file.validate';
import { StorageService } from '@components/storage/storage.service';
import { ErrorResponse } from '@utils/errorResponse';

export class StorageController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  uploadFile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, prefix } = StorageUploadSchema.parse(req.query);
      const file = req.file;
      if (!file) {
        throw new ErrorResponse('No file uploaded', StatusCodes.BAD_REQUEST);
      }

      const uploadedFile = await this.storageService.uploadFile(userId, prefix, file);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: uploadedFile,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'user',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  listFiles = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const prefix = req.params[0];

      const files = await this.storageService.listFiles(prefix);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: files,
        message: 'File listed successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'user',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  getSizeInfo = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const prefix = req.query.prefix as string;

      const sizeInfo = await this.storageService.getSizeInfo(prefix);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: sizeInfo,
        message: 'Size info retrieved successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'user',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  getFile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const path = req.params[0] as string;
      const force = req.query.force === 'true';

      const url = await this.storageService.getFile(path, force);

      res.status(200).json({ url });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'user',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  createFolder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, prefix } = StorageUploadSchema.parse(req.query);

      if (!prefix) {
        throw new ErrorResponse('No folder name', StatusCodes.BAD_REQUEST);
      }

      const createFolder = await this.storageService.createFolder(userId, prefix);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: createFolder,
        message: 'Folder created successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'user',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  deleteObject = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, prefix } = StorageUploadSchema.parse(req.query);

      if (!prefix) {
        throw new ErrorResponse('No object path', StatusCodes.BAD_REQUEST);
      }

      const deleteFolder = await this.storageService.deleteObject(userId, prefix);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: deleteFolder,
        message: 'Object deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'user',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });
}
