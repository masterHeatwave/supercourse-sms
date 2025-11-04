import { Request, Response, NextFunction } from 'express';
import crypt from '@utils/crypt';
import { logger } from '@utils/logger';
import { asyncHandler } from './async';

const encrypt = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const dataToEncrypt: string = JSON.stringify(req.body || {});
  const encrypted: string = crypt.encrypt(dataToEncrypt);
  req.body.data = encrypted;

  next();
});

const decrypt = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info(req.body.data);
  const encryptedData: string = req.body.data;
  const decrypted: string = crypt.decrypt(encryptedData);
  req.body = JSON.parse(decrypted || '');
  logger.info(`++++${req.body}`);
  next();
});

export { decrypt, encrypt };
