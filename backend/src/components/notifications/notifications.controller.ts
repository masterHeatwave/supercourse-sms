import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import notificationsService from './notifications.service';

const queryAll = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const filter = req.params.distributorId ? { distributor: req.params.distributorId } : {};
  const notifications = await notificationsService.queryAll(filter);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: { notifications },
    success: true,
  });
});

const markAsRead = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { notificationId } = req.params;
  const notification = await notificationsService.markAsRead(notificationId);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: { notification },
    success: true,
  });
});

export default {
  queryAll,
  markAsRead,
};
