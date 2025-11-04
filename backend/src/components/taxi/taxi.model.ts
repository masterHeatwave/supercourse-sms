import mongoose, { Schema } from 'mongoose';
import { ITaxi } from './taxi.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { notificationPlugin } from '@plugins/notifications';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { ActivityEntityType } from '@components/activity/activity.interface';
import { activityTrackerPlugin } from '@plugins/activityTracker';
import {
  emitTaxiSignal,
  StaffAssignmentSignalType,
} from '@components/staff-academic-assignments/staff-academic-assignments.signals';

const TaxiSchema: Schema<ITaxi> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    color: {
      type: String,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Please add a branch'],
    },
    subject: {
      type: String,
    },
    level: {
      type: String,
    },
    academic_year: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Please add an academic year'],
    },
    academic_period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPeriod',
      required: [true, 'Please add an academic period'],
    },
    academic_subperiods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubperiod',
      },
    ],
    cefr_level: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    scap_products: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for sessions
TaxiSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'taxi',
});

TaxiSchema.plugin(toJson);
TaxiSchema.plugin(advancedResultsPlugin);
TaxiSchema.plugin(createdBy);
TaxiSchema.plugin(notificationPlugin, [
  {
    action: 'create',
    title: (doc: ITaxi) => `New Taxi ${doc.name} has been created`,
  },
]);
TaxiSchema.plugin(tenantAwarePlugin);

// Apply activity tracker plugin for taxi actions
TaxiSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.TAXI,
  entityNameField: 'name',
  getActivityDetails: (doc, isNew) => {
    return isNew ? `Created new class: ${doc.name}` : `Updated class: ${doc.name}`;
  },
});

// Post-save hook to emit signals when taxi/class details change
TaxiSchema.post('save', async function (doc, next) {
  try {
    // Emit signal for taxi creation/updates that might affect staff assignments
    emitTaxiSignal(StaffAssignmentSignalType.TAXI_CREATED, {
      taxiId: (doc as any)._id.toString(),
      branchId: doc.branch?.toString(),
      academicYear: doc.academic_year?.toString(),
      academicPeriod: doc.academic_period?.toString(),
      affectedStaffIds: doc.users?.map((user: any) => user.toString()) || [],
    });
  } catch (error) {
    console.error('Error emitting taxi signal for staff academic assignments:', error);
  }
  next();
});

// Post-update hook for taxi updates
TaxiSchema.post('findOneAndUpdate', async function (doc, next) {
  try {
    if (doc) {
      emitTaxiSignal(StaffAssignmentSignalType.TAXI_UPDATED, {
        taxiId: (doc as any)._id.toString(),
        branchId: doc.branch?.toString(),
        academicYear: doc.academic_year?.toString(),
        academicPeriod: doc.academic_period?.toString(),
        affectedStaffIds: doc.users?.map((user: any) => user.toString()) || [],
      });
    }
  } catch (error) {
    console.error('Error emitting taxi update signal for staff academic assignments:', error);
  }
  next();
});

// Post-delete hook for taxi deletion
TaxiSchema.post('findOneAndDelete', async function (doc, next) {
  try {
    if (doc) {
      emitTaxiSignal(StaffAssignmentSignalType.TAXI_DELETED, {
        taxiId: (doc as any)._id.toString(),
        branchId: doc.branch?.toString(),
        academicYear: doc.academic_year?.toString(),
        academicPeriod: doc.academic_period?.toString(),
        affectedStaffIds: doc.users?.map((user: any) => user.toString()) || [],
      });
    }
  } catch (error) {
    console.error('Error emitting taxi delete signal for staff academic assignments:', error);
  }
  next();
});

const Taxi = mongoose.model<
  ITaxi,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<ITaxi>
>('Taxi', TaxiSchema);

export default Taxi;
export { TaxiSchema };
