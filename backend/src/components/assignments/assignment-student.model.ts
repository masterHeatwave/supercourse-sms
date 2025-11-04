import { Schema, model } from 'mongoose';

import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import AcademicSubperiod from '@components/academic/academic-subperiods.model';
import Customer from '@components/customers/customer.model';
import User from '@components/users/user.model';
import Taxi from '@components/taxi/taxi.model';

import { AssignmentForStaff } from './assignment-staff.model';

import { IAssignmentForStudent, IAssignmentAcademicTimeframe, IAssignmentTask } from './assignment-student.interface';

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
      // ref: EbookActivity,
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

    attempts: {
      type: Number,
      required: true,
      default: 0,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },

    taskStatus: {
      type: String,
      enum: ['new', 'in-progress', 'completed'],
      required: true,
      default: 'new',
    },

    answers: {
      type: Schema.Types.Mixed,
      required: false,
    },

    answersRevealed: {
      type: Boolean,
      required: true,
      default: false,
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

const AssignmentForStudentSchema = new Schema<IAssignmentForStudent>(
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
    staffAssignmentID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: AssignmentForStaff,
    },

    classID: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: Taxi,
    },
    studentID: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: User,
    },

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

    assignmentStatus: {
      type: String,
      enum: ['new', 'in-progress', 'completed'],
      required: true,
      default: 'new',
    },

    academicTimeframe: {
      type: AssignmentAcademicTimeframeSchema,
      required: true,
    },

    isDeletedForMe: {
      type: Boolean,
      required: true,
      default: false,
    },
    deleteDateForMe: {
      type: Date,
      required: false,
    },
    isDeletedForEveryone: {
      type: Boolean,
      required: true,
      default: false,
    },
    deleteDateForEveryone: {
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
    collection: 'assignments-students',
  }
);

AssignmentForStudentSchema.index({ schoolID: 1, branchID: 1 });
AssignmentForStudentSchema.index({ staffID: 1 });
AssignmentForStudentSchema.index({ staffAssignmentID: 1 });
AssignmentForStudentSchema.index({ classID: 1 });
AssignmentForStudentSchema.index({ studentID: 1 });
AssignmentForStudentSchema.index({ startDate: 1, endDate: 1 });
AssignmentForStudentSchema.index({ assignmentStatus: 1 });
AssignmentForStudentSchema.index({ isDeletedForMe: 1, isDeletedForEveryone: 1, isPermanentlyDeleted: 1 });

AssignmentForStudentSchema.plugin(tenantAwarePlugin);

AssignmentForStudentSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date!'));
    return;
  }

  if (this.isDeletedForMe && !this.deleteDateForMe) {
    this.deleteDateForMe = new Date();
  }

  if (this.isDeletedForEveryone && !this.deleteDateForEveryone) {
    this.deleteDateForEveryone = new Date();
  }

  next();
});

AssignmentForStudentSchema.virtual('isActive').get(function () {
  const now = new Date();
  return !this.isDeletedForEveryone && !this.isPermanentlyDeleted && this.startDate <= now && this.endDate >= now;
});

AssignmentForStudentSchema.virtual('isUpcoming').get(function () {
  const now = new Date();
  return !this.isDeletedForEveryone && !this.isPermanentlyDeleted && this.startDate > now;
});

AssignmentForStudentSchema.virtual('isPastDue').get(function () {
  const now = new Date();
  return !this.isDeletedForEveryone && !this.isPermanentlyDeleted && this.endDate < now;
});

export const AssignmentForStudent = model<IAssignmentForStudent>('AssignmentForStudent', AssignmentForStudentSchema);
