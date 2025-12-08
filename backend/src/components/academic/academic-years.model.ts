import mongoose, { Schema } from 'mongoose';
import { IAcademicYear } from './academic-years.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const AcademicYearSchema: Schema<IAcademicYear> = new mongoose.Schema(
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
    is_manual_active: {
      type: Boolean,
      default: false,
    },
    is_current: {
      type: Boolean,
      default: false,
      description: 'Computed field: true if current date falls within start_date and end_date',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AcademicYearSchema.virtual('academic_periods', {
  ref: 'AcademicPeriod',
  localField: '_id',
  foreignField: 'academic_year',
});

/**
 * Pre-save hook to compute is_current based on date range
 * Checks if today's date falls within the academic year's start and end dates
 */
AcademicYearSchema.pre('save', function (next) {
  const now = new Date();
  const startDate = new Date(this.start_date);
  const endDate = new Date(this.end_date);

  // Reset time parts to compare dates only
  now.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  this.is_current = startDate <= now && now <= endDate;
  next();
});

AcademicYearSchema.plugin(toJson);
AcademicYearSchema.plugin(advancedResultsPlugin);
AcademicYearSchema.plugin(createdBy);
AcademicYearSchema.plugin(tenantAwarePlugin);

const AcademicYear = mongoose.model<
  IAcademicYear,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IAcademicYear>
>('AcademicYear', AcademicYearSchema);

export default AcademicYear;
export { AcademicYearSchema };
