import Notifications from './notifications.model';
import { FilterQuery } from 'mongoose';
import { Notification } from './notifications.interface';
import { io } from '@config/socket';

const queryAll = async (filter: FilterQuery<Notification> = {}) => {
  const notifications = await Notifications.find(filter).populate('distributor').sort({ createdAt: -1 });

  return notifications;
};

const markAsRead = async (notificationId: string) => {
  const notification = await Notifications.findByIdAndUpdate(
    notificationId,
    {
      isRead: true,
      read_at: new Date(),
    },
    { new: true }
  );

  return notification;
};

const createNotification = async (data: Partial<Notification>) => {
  const notification = await Notifications.create({
    ...data,
    sent_at: new Date(),
  });

  io.emit('notification', {
    type: 'NEW_NOTIFICATION',
    payload: notification,
  });

  return notification;
};

export default {
  queryAll,
  markAsRead,
  createNotification,
};
