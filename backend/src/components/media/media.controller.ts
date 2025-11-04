import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '@utils/logger';

const upload = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const publicPath = path.join(process.cwd(), 'public');
    const mediaPath = path.join(publicPath, 'media');
    fs.ensureDirSync(mediaPath);

    if (!req.files || Object.keys(req.files).length === 0) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        message: 'No files were uploaded',
        success: false,
      });
    }

    const mediaFiles = req.files.media;
    let mediaFile;

    if (Array.isArray(mediaFiles)) {
      mediaFile = mediaFiles[0];
    } else {
      mediaFile = mediaFiles;
    }

    if (!mediaFile) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        message: 'No media file found',
        success: false,
      });
    }

    const timestamp = Date.now();
    const newFilename = `${timestamp}-${mediaFile.name.replace(/\s+/g, '-').toLowerCase()}`;

    const destPath = path.join(mediaPath, newFilename);

    await fs.copy(mediaFile.tempFilePath, destPath);

    await fs.remove(mediaFile.tempFilePath);

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: {
        path: `media/${newFilename}`,
        filename: newFilename,
        originalname: mediaFile.name,
        mimetype: mediaFile.mimetype,
      },
      success: true,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    logger.error(`Error uploading file: ${error}`);
    return jsonResponse(res, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'An error occurred while uploading file',
      success: false,
    });
  }
});

export default {
  upload,
};
