import { Request, Response, NextFunction } from 'express';
import { config } from '@config/config';
import { ErrorResponse } from '@utils/errorResponse';

/**
 * Middleware that verifies the API key in the request headers
 * This is used for internal API endpoints that should only be accessible by other systems
 */
export const verifyApiKey = (req: Request, _res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(new ErrorResponse('API key is required', 401));
  }

  // Compare with the configured API key
  if (apiKey !== config.API_KEY) {
    return next(new ErrorResponse('Invalid API key', 401));
  }

  next();
};
