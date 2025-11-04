import { Schema, model } from 'mongoose';

import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import AcademicSubperiod from '@components/academic/academic-subperiods.model';
import Customer from '@components/customers/customer.model';
import User from '@components/users/user.model';
import Taxi from '@components/taxi/taxi.model';

import { IAssignmentForStaff, IAssignmentAcademicTimeframe, IAssignmentTask } from './assignment-staff.interface';

import { tenantAwarePlugin } from '@plugins/tenantAware';

const AssignmentTaskSchema = new Schema<IAssignmentTask>(
  {
    resourceType: {
      type: String,
      enum: ['ebook', 'custom-activity', 'open-task'],
      required: true,
    },

    ebookID: {
      type: Schema.Types.ObjectId,
      required: false,
      // ref: Material,
    },
    ebookActivityID: {
      type: Schema.Types.ObjectId,
      required: false,
      // ref: BookContent,
    },

    customActivityID: {
      type: Schema.Types.ObjectId,
      required: false,
      // ref: CustomActivity,
    },

    openTaskType: {
      type: String,
      enum: ['speaking', 'writing'],
      required: false,
    },
    openTaskTitle: {
      type: String,
      required: false,
    },
    openTaskInstructions: {
      type: String,
      required: false,
    },

    assignedAs: {
      type: String,
      enum: ['exercise', 'exam'],
      required: true,
    },

    instructions: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const AssignmentAcademicTimeframeSchema = new Schema<IAssignmentAcademicTimeframe>(
  {
    academicYear: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: AcademicYear,
    },
    academicPeriod: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: AcademicPeriod,
    },
    academicTerm: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: AcademicSubperiod,
    },
  },
  { _id: false }
);

const AssignmentForStaffSchema = new Schema<IAssignmentForStaff>(
  {
    schoolID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: Customer,
    },
    branchID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: Customer,
    },

    staffID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: User,
    },
    staffRole: {
      type: String,
      enum: ['admin', 'manager', 'teacher'],
      required: true,
    },

    classID: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: Taxi,
    },
    studentsIDs: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],

    title: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },

    tasks: [AssignmentTaskSchema],

    academicTimeframe: {
      type: AssignmentAcademicTimeframeSchema,
      required: true,
    },

    isDrafted: {
      type: Boolean,
      required: true,
      default: false,
    },
    draftDate: {
      type: Date,
      required: false,
    },
    isDeletedForMe: {
      type: Boolean,
      required: true,
      default: false,
    },
    deletedForMeDate: {
      type: Date,
      required: false,
    },
    isDeletedForEveryone: {
      type: Boolean,
      required: true,
      default: false,
    },
    deletedForEveryoneDate: {
      type: Date,
      required: false,
    },
    isPermanentlyDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'assignments-staff',
  }
);

AssignmentForStaffSchema.index({ schoolID: 1, branchID: 1 });
AssignmentForStaffSchema.index({ staffID: 1 });
AssignmentForStaffSchema.index({ classID: 1 });
AssignmentForStaffSchema.index({ startDate: 1, endDate: 1 });
AssignmentForStaffSchema.index({ isDrafted: 1, isDeletedForMe: 1, isDeletedForEveryone: 1, isPermanentlyDeleted: 1 });

AssignmentForStaffSchema.plugin(tenantAwarePlugin);

AssignmentForStaffSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date!'));
    return;
  }

  if (this.isDrafted && !this.draftDate) {
    this.draftDate = new Date();
  }

  if (this.isDeletedForMe && !this.deletedForMeDate) {
    this.deletedForMeDate = new Date();
  }

  if (this.isDeletedForEveryone && !this.deletedForEveryoneDate) {
    this.deletedForEveryoneDate = new Date();
  }

  next();
});

AssignmentForStaffSchema.virtual('isActive').get(function () {
  const now = new Date();
  return !this.isDeletedForEveryone && !this.isPermanentlyDeleted && this.startDate <= now && this.endDate >= now;
});

AssignmentForStaffSchema.virtual('isUpcoming').get(function () {
  const now = new Date();
  return !this.isDeletedForEveryone && !this.isPermanentlyDeleted && this.startDate > now;
});

AssignmentForStaffSchema.virtual('isPastDue').get(function () {
  const now = new Date();
  return !this.isDeletedForEveryone && !this.isPermanentlyDeleted && this.endDate < now;
});

export const AssignmentForStaff = model<IAssignmentForStaff>('AssignmentForStaff', AssignmentForStaffSchema);
