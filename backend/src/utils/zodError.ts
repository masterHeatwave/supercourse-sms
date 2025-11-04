import { ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { APIResponses } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const zodErrorHandler = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.VALIDATION_ERROR,
      errors: err.errors,
      success: false,
    });
  }
  next(err);
};

export { zodErrorHandler };
