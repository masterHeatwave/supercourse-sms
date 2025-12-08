import mongoose, { Schema } from 'mongoose';
import { IAcademicPeriod } from './academic-periods.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { syncAllStaffForNewPeriod } from '@components/staff-academic-assignments/staff-academic-assignments.sync';

const AcademicPeriodSchema: Schema<IAcademicPeriod> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    start_date: {
      type: Date,
      required: [true, 'Please add a start date'],
    },
    end_date: {
      type: Date,
      required: [true, 'Please add an end date'],
    },
    academic_year: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Please add an academic year'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AcademicPeriodSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'academic_period',
});

/**
 * Pre-save hook to compute is_active based on date range
 * Sets is_active = true only if current date falls within the period's start_date and end_date
 */
AcademicPeriodSchema.pre('save', function (next) {
  const now = new Date();
  const startDate = new Date(this.start_date);
  const endDate = new Date(this.end_date);

  // Reset time parts to compare dates only
  now.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  this.is_active = startDate <= now && now <= endDate;
  next();
});

AcademicPeriodSchema.plugin(toJson);
AcademicPeriodSchema.plugin(advancedResultsPlugin);
AcademicPeriodSchema.plugin(createdBy);
AcademicPeriodSchema.plugin(tenantAwarePlugin);

// Post-save hook to sync staff academic assignments when a new period is created
AcademicPeriodSchema.post('save', async function (doc: IAcademicPeriod, next) {
  try {
    // Only trigger for new academic periods
    if (doc.isNew) {
      await syncAllStaffForNewPeriod((doc as any)._id.toString(), (doc.academic_year as any).toString());
    }
  } catch (error) {
    console.error('Error syncing staff academic assignments for new period:', error);
    // Don't fail the period save operation if assignment sync fails
  }
  next();
});

const AcademicPeriod = mongoose.model<
  IAcademicPeriod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IAcademicPeriod>
>('AcademicPeriod', AcademicPeriodSchema);

export default AcademicPeriod;
export { AcademicPeriodSchema };
