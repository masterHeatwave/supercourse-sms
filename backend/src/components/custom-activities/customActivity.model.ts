import mongoose, { Schema } from 'mongoose';
import { ICustomActivity } from './customActivity.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import User from '@components/users/user.model';
//import Taxi from '@components/taxi/taxi.model';
//import AcademicSubperiod from '@components/academic/academic-subperiods.model';
//const { lmsDB } = require("../dbConnections");

const CustomActivitySchema: Schema<ICustomActivity> = new mongoose.Schema(
  {
    activityType: {
      type: String,
      required: true,
    },
    typeString: {
      type: String,
      required: true,
    },
    playerMode: {
      type: String,
      required: true,
    },
    playerModeString: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    cefr: {
      type: String,
      required: true,
    },
    tags: [{ type: String, required: true }],
    settings: {
      type: Map,
      of: Boolean,
    },
    questions: [{ type: Schema.Types.Mixed, required: true }],
  },
  {
    discriminatorKey: 'activityType',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CustomActivitySchema.plugin(toJson);
CustomActivitySchema.plugin(advancedResultsPlugin);
CustomActivitySchema.plugin(createdBy);
CustomActivitySchema.plugin(tenantAwarePlugin);

const CustomActivity = mongoose.model<
  ICustomActivity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<ICustomActivity>
>('customActivity', CustomActivitySchema);

export default CustomActivity;
export { CustomActivitySchema };
