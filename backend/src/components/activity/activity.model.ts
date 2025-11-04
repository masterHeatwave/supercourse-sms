import mongoose, { Schema } from 'mongoose';
import { IActivity, ActivityActionType, ActivityEntityType } from './activity.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const ActivitySchema: Schema<IActivity> = new mongoose.Schema(
  {
    action_type: {
      type: String,
      enum: Object.values(ActivityActionType),
      required: [true, 'Please add an action type'],
    },
    entity_type: {
      type: String,
      enum: Object.values(ActivityEntityType),
      required: [true, 'Please add an entity type'],
    },
    entity_id: {
      type: String,
      required: [true, 'Please add an entity ID'],
    },
    entity_name: {
      type: String,
      required: [true, 'Please add an entity name'],
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add a user who performed the action'],
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ActivitySchema.plugin(toJson);
ActivitySchema.plugin(advancedResultsPlugin);
ActivitySchema.plugin(createdBy);
ActivitySchema.plugin(tenantAwarePlugin);

export default mongoose.model<
  IActivity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IActivity>
>('Activity', ActivitySchema);

export { ActivitySchema };
