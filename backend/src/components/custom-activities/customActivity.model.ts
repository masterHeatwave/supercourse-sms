import mongoose, { Schema } from 'mongoose';
import { IAssignedCustomActivity, ICustomActivity } from './customActivity.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import Taxi from '@components/taxi/taxi.model';
//import Taxi from '@components/taxi/taxi.model';
//import AcademicSubperiod from '@components/academic/academic-subperiods.model';
//const { lmsDB } = require("../dbConnections");

const activityBaseFields = {
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
  plays: {
    type: Number,
    required: true,
  },
  totalDuration: {
    type: Number,
    required: true,
  },
  tags: [{ type: String, required: true }],
  settings: {
    type: Map,
    of: Boolean,
    required: true,
  },
  questions: [{ type: Schema.Types.Mixed, required: true }],
};

const schemaOptions = {
  discriminatorKey: 'activityType',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

const CustomActivitySchema = new mongoose.Schema(activityBaseFields, schemaOptions);

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

const AssignedCustomActivitySchema = new mongoose.Schema(
  {
    ...activityBaseFields,
    students: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: User,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
          required: true,
        },
      },
    ],
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Taxi,
      required: true,
    },
    originalActivity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: CustomActivity,
      required: true,
    },
    assignmentBundle: {
      type: String,
      required: true,
    },
  },
  schemaOptions
);

AssignedCustomActivitySchema.plugin(toJson);
AssignedCustomActivitySchema.plugin(advancedResultsPlugin);
AssignedCustomActivitySchema.plugin(createdBy);
AssignedCustomActivitySchema.plugin(tenantAwarePlugin);

const AssignedCustomActivity = mongoose.model<
  IAssignedCustomActivity,
  IAdvancedResultsModel<any> & ICreatorModel<IAssignedCustomActivity>
>('assignedCustomActivity', AssignedCustomActivitySchema);

export { CustomActivitySchema, AssignedCustomActivitySchema, AssignedCustomActivity };
