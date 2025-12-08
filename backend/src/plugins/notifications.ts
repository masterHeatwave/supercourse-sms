import { Schema, Query, Model, Document } from 'mongoose';
import NotificationModel from '@components/notifications/notifications.model';
import { io } from '@config/socket';
// Distributor service no longer exists

interface NotificationPluginConfig {
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  title: string | ((doc: any) => string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition?: (doc: any, update?: any) => boolean;
}

// Plugin can accept single config or array of configs
type NotificationPluginOptions = NotificationPluginConfig | NotificationPluginConfig[];

export const notificationPlugin = (schema: Schema, options: NotificationPluginOptions) => {
  const configs = Array.isArray(options) ? options : [options];

  configs.forEach((config) => {
    // Handle create action
    if (config.action === 'create') {
      schema.post('save', async function (this: Document) {
        if (config.condition && !config.condition(this)) {
          return;
        }

        const title = typeof config.title === 'function' ? config.title(this) : config.title;
        // Access modelName through the model property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelName = (this.constructor as Model<any>).modelName;
        // Use a fixed value for distributor since it's no longer a service
        const distributor = 'system';

        try {
          const notification = await NotificationModel.create({
            notification_type: modelName,
            title: title,
            content: '',
            sent_at: new Date(),
            distributor: distributor,
          });

          if (process.env.NODE_ENV !== 'test' && io && typeof io.emit === 'function') {
            io.emit('notification', {
              type: 'NEW_NOTIFICATION',
              payload: notification,
            });
          }
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      });
    }

    // Handle update action
    if (config.action.includes('update')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema.pre(config.action as any, async function (this: Query<any, any>, next) {
        const update = this.getUpdate();
        if (config.condition && !config.condition(this, update)) {
          return next();
        }

        const title = typeof config.title === 'function' ? config.title(this) : config.title;
        // For update operations, we need to get the model name differently
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelName = (this.model as Model<any>).modelName;
        // Use a fixed value for distributor since it's no longer a service
        const distributor = 'system';

        try {
          const notification = await NotificationModel.create({
            notification_type: modelName,
            title: title,
            content: '',
            sent_at: new Date(),
            distributor: distributor,
          });

          if (io && typeof io.emit === 'function') {
            io.emit('notification', {
              type: 'NEW_NOTIFICATION',
              payload: notification,
            });
          }
        } catch (error) {
          console.error('Error creating notification:', error);
        }

        next();
      });
    }
  });
};
