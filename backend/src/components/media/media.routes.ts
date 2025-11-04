import express from 'express';
import mediaController from './media.controller';
import { authorize } from '@middleware/authorize';
import fileUpload from 'express-fileupload';
import path from 'path';

export const mediaRouter = express.Router();

// Configure file upload middleware
const fileUploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'temp'),
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// Media upload endpoint - requires authentication
mediaRouter.post('/upload', authorize(['admin', 'manager', 'staff']), fileUploadMiddleware, mediaController.upload);
