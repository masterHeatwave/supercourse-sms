import mongoose, { Schema } from 'mongoose';
import { ISession } from './session.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { notificationPlugin } from '@plugins/notifications';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const SessionSchema: Schema<ISession> = new mongoose.Schema(
  {
    start_date: {
      type: Date,
      required: [true, 'Please add a start date'],
    },
    end_date: {
      type: Date,
      required: [true, 'Please add an end date'],
    },
    taxi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxi',
      required: [true, 'Please add a taxi'],
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Please add a classroom'],
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
    is_recurring: {
      type: Boolean,
      default: false,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
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
    // Recurring session fields
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

// Virtual field to populate absences for this session
SessionSchema.virtual('absences', {
  ref: 'Absence',
  localField: '_id',
  foreignField: 'session',
});

// Virtual field for session duration in hours
SessionSchema.virtual('session_duration').get(function (this: ISession) {
  if (!this.start_date || !this.end_date) return 0;
  const durationMs = this.end_date.getTime() - this.start_date.getTime();
  return Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
});

// Virtual field for sessions per week
SessionSchema.virtual('sessions_per_week').get(function (this: ISession) {
  if (this.is_recurring && this.frequency) {
    return Math.round((1 / this.frequency) * 100) / 100;
  }
  return 1;
});

// Virtual field for total hours per week
SessionSchema.virtual('total_hours_per_week').get(function (this: ISession) {
  const sessionDuration = this.session_duration || 0;
  const sessionsPerWeek = this.sessions_per_week || 1;
  return Math.round(sessionDuration * sessionsPerWeek * 100) / 100;
});

// Pre-save hook for dynamic is_recurring determination
SessionSchema.pre('save', function (this: ISession, next) {
  // Dynamic is_recurring determination - only set to true if all required fields are present
  if (this.is_recurring === undefined || this.is_recurring === null) {
    this.is_recurring = !!(this.day && this.frequency && this.start_time && this.duration);
  } else if (this.is_recurring === false && this.day && this.frequency && this.start_time && this.duration) {
    this.is_recurring = true;
  }

  next();
});

SessionSchema.plugin(toJson);
SessionSchema.plugin(advancedResultsPlugin);
SessionSchema.plugin(createdBy);
SessionSchema.plugin(notificationPlugin, [
  {
    action: 'create',
    title: (doc: ISession) => `New Session for ${doc.start_date.toLocaleString()} has been created`,
  },
]);
SessionSchema.plugin(tenantAwarePlugin);

const Session = mongoose.model<
  ISession,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<ISession>
>('Session', SessionSchema);

export default Session;
export { SessionSchema };
