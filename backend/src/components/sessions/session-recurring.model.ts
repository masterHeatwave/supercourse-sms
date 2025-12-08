import mongoose, { Schema } from 'mongoose';
import { ISessionRecurring } from './session-recurring.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const SessionRecurringSchema: Schema<ISessionRecurring> = new mongoose.Schema(
  {
    parent_session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Parent session is required'],
      index: true,
    },
    start_date: {
      type: Date,
      required: [true, 'Please add a start date'],
      index: true,
    },
    end_date: {
      type: Date,
      required: [true, 'Please add an end date'],
    },
    instance_number: {
      type: Number,
      required: [true, 'Instance number is required'],
    },
    taxi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxi',
      required: [true, 'Please add a taxi'],
      index: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: false, // Optional - required only when mode is not 'online'
      index: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    academic_period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPeriod',
      required: [true, 'Please add an academic period'],
    },
    academic_subperiod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubperiod',
    },
    room: {
      type: String,
    },
    color: {
      type: String,
    },
    notes: {
      type: String,
    },
    invite_participants: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ['in_person', 'online', 'hybrid'],
    },
    // Recurring session fields (inherited from parent)
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    start_time: {
      type: String,
    },
    duration: {
      type: Number,
    },
    frequency: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to populate absences for this recurring session instance
SessionRecurringSchema.virtual('absences', {
  ref: 'Absence',
  localField: '_id',
  foreignField: 'session',
});

// Compound index for efficient querying
SessionRecurringSchema.index({ parent_session: 1, instance_number: 1 });
SessionRecurringSchema.index({ start_date: 1, end_date: 1 });
SessionRecurringSchema.index({ taxi: 1, start_date: 1, end_date: 1 });
SessionRecurringSchema.index({ classroom: 1, start_date: 1, end_date: 1 });

SessionRecurringSchema.plugin(toJson);
SessionRecurringSchema.plugin(advancedResultsPlugin);
SessionRecurringSchema.plugin(createdBy);
SessionRecurringSchema.plugin(tenantAwarePlugin);

const SessionRecurring = mongoose.model<
  ISessionRecurring,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<ISessionRecurring>
>('SessionRecurring', SessionRecurringSchema);

export default SessionRecurring;
export { SessionRecurringSchema };
