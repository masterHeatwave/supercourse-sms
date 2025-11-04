import mongoose, { Schema } from 'mongoose';
import { IClassroom } from './classroom.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const ClassroomSchema: Schema<IClassroom> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    capacity: {
      type: Number,
    },
    location: {
      type: String,
    },
    equipment: [
      {
        type: String,
      },
    ],
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Please specify the customer/branch ID'],
    },
    type: {
      type: String,
      enum: [
        'standard',
        'computer_lab',
        'science_lab',
        'art_studio',
        'music_room',
        'gymnasium',
        'library',
        'conference_room',
      ],
      default: 'standard',
    },
    description: {
      type: String,
    },
    availability: {
      type: String,
      enum: ['available', 'unavailable', 'out_of_order', 'under_maintenance'],
      default: 'available',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for sessions
ClassroomSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'classroom',
});

ClassroomSchema.plugin(toJson);
ClassroomSchema.plugin(advancedResultsPlugin);
ClassroomSchema.plugin(createdBy);
ClassroomSchema.plugin(tenantAwarePlugin);

const Classroom = mongoose.model<
  IClassroom,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IClassroom>
>('Classroom', ClassroomSchema);

export default Classroom;
export { ClassroomSchema };
