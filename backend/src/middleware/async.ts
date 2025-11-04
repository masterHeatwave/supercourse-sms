import { NextFunction, Request, Response } from 'express';
import { acceptFunction } from '@middleware/async.types';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { APIResponses } from '../types';

export const asyncHandler = (fn: acceptFunction) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fn(req, res, next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('Async Handler Error', error);
    if (error?.kind === 'ObjectId') {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        message: APIResponses.RESOURCE_NOT_FOUND,
        success: false,
      });
    }
    if (error?.message === APIResponses.INVALID_TOKEN) {
      return jsonResponse(res, {
        status: StatusCodes.UNAUTHORIZED,
        message: APIResponses.INVALID_TOKEN,
        success: false,
      });
    }
    if (error?.message === APIResponses.RESOURCE_NOT_FOUND) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        message: APIResponses.RESOURCE_NOT_FOUND,
        success: false,
      });
    }
    if (error?.message === APIResponses.INVALID_CREDENTIALS) {
      return jsonResponse(res, {
        status: StatusCodes.UNAUTHORIZED,
        message: APIResponses.INVALID_CREDENTIALS,
        success: false,
      });
    }
    next(error);
  }
};
