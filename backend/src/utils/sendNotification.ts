import notificationsModel from '@components/notifications/notifications.model';
import { io } from '@config/socket';

export const sendNotification = async (title: string, distributor: string) => {
  const notification = await notificationsModel.create({
    notification_type: 'Product',
    title,
    content: '',
    sent_at: new Date(),
    distributor,
  });

  if (process.env.NODE_ENV !== 'test' && io && typeof io.emit === 'function') {
    io.emit('notification', {
      type: 'NEW_NOTIFICATION',
      payload: notification,
    });
  }
};
