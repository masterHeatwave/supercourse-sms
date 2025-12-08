import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { AsyncResource } from 'async_hooks';
import { logger } from '@utils/logger';

const upload = multer({ storage: multer.memoryStorage() }).single('file');

export const storageUpload = (req: Request, res: Response, next: NextFunction) => {
  const context = requestContextLocalStorage.getStore();

  if (!context) {
    logger.warn('No tenant context found before multer.');
  }

  // Ensure the current execution has the context
  requestContextLocalStorage.enterWith(context);

  // Create an AsyncResource to run completion callback in proper async scope
  const ar = new AsyncResource('MULTER_COMPLETE');

  // Call multer but intercept its completion by providing our own callback
  upload(req, res, (err?: any) => {
    // Run the continuation inside the AsyncResource and re-enter ALS store
    ar.runInAsyncScope(() => {
      requestContextLocalStorage.enterWith(context);
      // forward error (if any) to next inside the correct context
      next(err);
    });
  });
};
