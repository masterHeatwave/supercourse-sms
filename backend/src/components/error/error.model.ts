import mongoose, { Schema } from 'mongoose';
import toJson from '@plugins/toJson';
import { EnumErrorLocation, IError } from '@components/error/error.interface';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';

const ErrorSchema: Schema<IError> = new mongoose.Schema(
  {
    title: { type: String },
    message: { type: String },
    status_code: { type: Number },
    location: { type: String, enum: EnumErrorLocation },
  },
  {
    timestamps: true,
  }
);

ErrorSchema.plugin(toJson);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default mongoose.model<IError, IAdvancedResultsModel<any>>('Test', ErrorSchema);
