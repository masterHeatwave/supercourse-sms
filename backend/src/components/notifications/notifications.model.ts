import mongoose, { Schema } from 'mongoose';
import toJson from '../../plugins/toJson';
import { Notification } from './notifications.interface';

const NotificationSchema: Schema<any> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    notification_type: {
      type: String,
      required: true,
    },
    read_at: {
      type: Schema.Types.Date,
    },
    sent_at: {
      type: Schema.Types.Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationSchema.plugin(toJson);
export default mongoose.model<Notification>('Notification', NotificationSchema);

export { NotificationSchema };
