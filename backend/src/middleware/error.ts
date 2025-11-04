import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jsonResponse } from './json-response';
import { ErrorResponse } from '@utils/errorResponse';
import { config } from '@config/config';
import { logger } from '@utils/logger';
import errorService from '@components/error/error.service';
import { EnumErrorLocation } from '@components/error/error.interface';

const errorHandler = (req: Request, res: Response): void => {
  const err = res.locals.error || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let error: any = { ...err };

  error.message = err.message;

  if (config.NODE_ENV !== 'development') {
    logger.info(err);
    logger.info(err.name);
  }

  if (err.name === 'CastError') {
    const message: string = `Resource not found`;
    error = new ErrorResponse(message, StatusCodes.NOT_FOUND);
  }

  if (err.code === 11000) {
    const message: string = 'Duplicate field value entered';
    error = new ErrorResponse(message, StatusCodes.BAD_REQUEST);
  }

  if (err.name === 'ValidationError') {
    const message: string = Object.values(err.errors)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((val: any) => val.message)
      .join(', ');
    error = new ErrorResponse(message, StatusCodes.BAD_REQUEST);
  }

  if (err.status === 401) {
    const message: string = `Invalid token credentials`;
    error = new ErrorResponse(message, StatusCodes.UNAUTHORIZED);
  }

  if (!res.locals) {
    res.locals = {};
  }
  res.locals.errorMessage = error.message || 'Server Error';

  errorService.create({
    title: error.message || 'Server Error',
    message: err.name || 'Server Error',
    status_code: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    location: EnumErrorLocation.BACKEND,
  });

  jsonResponse(res, {
    status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    success: false,
    error: error.message || 'Server Error',
    message: '',
    data: '',
  });
};

export default errorHandler;
