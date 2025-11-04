import mongoose, { Schema } from 'mongoose';
import { IAcademicSubperiod } from './academic-subperiods.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const AcademicSubperiodSchema: Schema<IAcademicSubperiod> = new mongoose.Schema(
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
    academic_period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPeriod',
      required: [true, 'Please add an academic period'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AcademicSubperiodSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'academic_subperiod',
});

AcademicSubperiodSchema.plugin(toJson);
AcademicSubperiodSchema.plugin(advancedResultsPlugin);
AcademicSubperiodSchema.plugin(createdBy);
AcademicSubperiodSchema.plugin(tenantAwarePlugin);

const AcademicSubperiod = mongoose.model<
  IAcademicSubperiod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IAcademicSubperiod>
>('AcademicSubperiod', AcademicSubperiodSchema);

export default AcademicSubperiod;
export { AcademicSubperiodSchema };
