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
    is_current: {
      type: Boolean,
      default: false,
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
