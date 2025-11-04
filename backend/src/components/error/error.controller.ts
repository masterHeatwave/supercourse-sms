import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import errorService from '@components/error/error.service';
import { createSchema } from '@components/error/error-validate.schema';

const create = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createSchema.parse(req.body);
  const data = await errorService.create(parsedBody);

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data,
    success: true,
  });
});

export default {
  create,
};
