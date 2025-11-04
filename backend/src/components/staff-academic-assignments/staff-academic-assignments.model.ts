import mongoose, { Schema } from 'mongoose';
import { IStaffAcademicAssignment } from './staff-academic-assignments.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { activityTrackerPlugin } from '@plugins/activityTracker';
import { ActivityEntityType, ActivityActionType } from '@components/activity/activity.interface';

const StaffAcademicAssignmentSchema: Schema<IStaffAcademicAssignment> = new mongoose.Schema(
  {
    staff_member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff member is required'],
      index: true,
    },
    academic_year: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },
    academic_period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPeriod',
      required: [true, 'Academic period is required'],
      index: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role is required'],
    },
    role_title: {
      type: String,
      required: [true, 'Role title is required'],
    },
    branches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
      },
    ],
    classes: [
      {
        type: String, // For now, store as strings. Can be ObjectId refs to Taxi model later
      },
    ],
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
StaffAcademicAssignmentSchema.index({ staff_member: 1, academic_period: 1 });
StaffAcademicAssignmentSchema.index({ academic_year: 1, academic_period: 1 });
StaffAcademicAssignmentSchema.index({ staff_member: 1, is_active: 1 });
StaffAcademicAssignmentSchema.index({ start_date: 1, end_date: 1 });

// Validation: End date must be after start date
StaffAcademicAssignmentSchema.pre('save', function (next) {
  if (this.start_date && this.end_date && this.start_date >= this.end_date) {
    next(new Error('End date must be after start date'));
    return;
  }
  next();
});

// Validation: At least one branch must be assigned
StaffAcademicAssignmentSchema.pre('save', function (next) {
  if (!this.branches || this.branches.length === 0) {
    next(new Error('At least one branch must be assigned'));
    return;
  }
  next();
});

// Virtual to check if assignment is current
StaffAcademicAssignmentSchema.virtual('is_current').get(function (this: IStaffAcademicAssignment) {
  const now = new Date();
  return this.is_active && this.start_date <= now && this.end_date >= now;
});

// Apply plugins
StaffAcademicAssignmentSchema.plugin(toJson);
StaffAcademicAssignmentSchema.plugin(advancedResultsPlugin);
StaffAcademicAssignmentSchema.plugin(createdBy);
StaffAcademicAssignmentSchema.plugin(tenantAwarePlugin);
StaffAcademicAssignmentSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.USER, // Using USER type as it's staff-related
  entityNameField: 'role_title',
  actions: [ActivityActionType.CREATE, ActivityActionType.UPDATE, ActivityActionType.DELETE],
});

const StaffAcademicAssignment = mongoose.model<
  IStaffAcademicAssignment,
  IAdvancedResultsModel<IStaffAcademicAssignment> & ICreatorModel<IStaffAcademicAssignment>
>('StaffAcademicAssignment', StaffAcademicAssignmentSchema);

export default StaffAcademicAssignment;
export { StaffAcademicAssignmentSchema };
