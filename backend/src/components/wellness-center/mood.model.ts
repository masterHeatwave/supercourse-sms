import mongoose, { Schema } from 'mongoose';
import { IMood, IMoodVideo } from './mood.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import Taxi from '@components/taxi/taxi.model';
import AcademicSubperiod from '@components/academic/academic-subperiods.model';
//const { lmsDB } = require("../dbConnections");

const MoodSchema: Schema<IMood> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    taxisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxi',
      required: true,
    },
    academic_subperiod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubperiod',
      required: true,
    },
    mood: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const MoodVideoSchema: Schema<IMoodVideo> = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    viewCount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MoodSchema.plugin(toJson);
MoodSchema.plugin(advancedResultsPlugin);
MoodSchema.plugin(createdBy);
MoodSchema.plugin(tenantAwarePlugin);

MoodVideoSchema.plugin(toJson);
MoodVideoSchema.plugin(advancedResultsPlugin);
MoodVideoSchema.plugin(createdBy);
MoodVideoSchema.plugin(tenantAwarePlugin);

const Mood = mongoose.model<
  IMood,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IMood>
>('Mood', MoodSchema);

const MoodVideo = mongoose.model<
  IMoodVideo,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IMoodVideo>
>('MoodVideo', MoodVideoSchema);

export default Mood;
export { MoodVideo, MoodSchema, MoodVideoSchema };
