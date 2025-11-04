import fs from 'fs-extra';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './async';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@config/config';

const tempDir = path.join(config.UPLOADS.LOCAL_PATH, 'temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const useTempStorage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  req.originalFilePaths = {};

  for (const file of files) {
    if (!file) continue;

    const tempId = uuidv4();
    const currentPath = file.path;
    const tempPath = path.join(tempDir, `${tempId}_${file.filename}`);

    req.originalFilePaths[file.fieldname] = {
      originalPath: currentPath,
      tempPath,
      filename: file.filename,
    };
    await fs.move(currentPath, tempPath);
    file.path = tempPath;
  }

  next();
});

export const moveToFinalStorage = async (req: Request): Promise<void> => {
  if (!req.originalFilePaths) return;

  // eslint-disable-next-line
  for (const [_fieldname, fileInfo] of Object.entries(req.originalFilePaths)) {
    if (!fileInfo) continue;

    const { tempPath, originalPath } = fileInfo as {
      tempPath: string;
      originalPath: string;
    };

    const dirPath = path.dirname(originalPath);
    await fs.ensureDir(dirPath);

    await fs.move(tempPath, originalPath, { overwrite: true });
  }
};

/**
 * Helper to clean up temporary files
 */
export const cleanupTempFiles = async (req: Request): Promise<void> => {
  if (!req.originalFilePaths) return;

  for (const fileInfo of Object.values(req.originalFilePaths)) {
    if (!fileInfo) continue;

    const { tempPath } = fileInfo as { tempPath: string };

    // Delete temp file if it exists
    if (await fs.pathExists(tempPath)) {
      await fs.unlink(tempPath);
    }
  }
};
