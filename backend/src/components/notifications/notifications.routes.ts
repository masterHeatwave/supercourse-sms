import express from 'express';
import { authorize } from '@middleware/authorize';
import notificationsController from '@components/notifications/notifications.controller';

export const notificationRouter = express.Router();

notificationRouter.route('/:distributorId').get(authorize('NOTIFICATIONS_QUERY_ALL'), notificationsController.queryAll);

notificationRouter
  .route('/:notificationId/read')
  .patch(authorize('NOTIFICATIONS_UPDATE'), notificationsController.markAsRead);
