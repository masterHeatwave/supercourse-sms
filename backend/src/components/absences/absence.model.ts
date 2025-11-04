import mongoose, { Schema } from 'mongoose';
import { IAbsence, AbsenceStatus } from './absence.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { notificationPlugin } from '@plugins/notifications';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const AbsenceSchema: Schema<IAbsence> = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Please add a session'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add a student'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(AbsenceStatus),
      default: AbsenceStatus.UNEXCUSED,
    },
    justification_document: {
      type: String,
    },
    taxi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxi',
      required: [true, 'Please add a taxi'],
    },
    academic_period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPeriod',
      required: [true, 'Please add an academic period'],
    },
    note: {
      type: String,
    },
    notified_parent: {
      type: Boolean,
      default: false,
    },
    notification_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AbsenceSchema.plugin(toJson);
AbsenceSchema.plugin(advancedResultsPlugin);
AbsenceSchema.plugin(createdBy);
AbsenceSchema.plugin(notificationPlugin, [
  {
    action: 'create',
    title: (doc: IAbsence) => `New Absence recorded for student on ${doc.date.toLocaleDateString()}`,
  },
]);
AbsenceSchema.plugin(tenantAwarePlugin);

const Absence = mongoose.model<IAbsence, IAdvancedResultsModel<IAbsence> & ICreatorModel<IAbsence>>(
  'Absence',
  AbsenceSchema
);

export default Absence;
export { AbsenceSchema };
