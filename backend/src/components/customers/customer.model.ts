import mongoose, { Schema } from 'mongoose';
import { CustomerType, ICustomer } from './customer.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { notificationPlugin } from '@plugins/notifications';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import {
  emitCustomerSignal,
  StaffAssignmentSignalType,
} from '@components/staff-academic-assignments/staff-academic-assignments.signals';

const CustomerSchema: Schema<ICustomer> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    slug: {
      type: String,
      required: [true, 'Please add a slug'],
      unique: true,
    },
    nickname: {
      type: String,
    },
    afm: {
      type: String,
    },
    facebook: {
      type: String,
    },
    instagram: {
      type: String,
    },
    twitter: {
      type: String,
    },
    youtube: {
      type: String,
    },
    avatar: {
      type: String,
    },
    website: {
      type: String,
    },
    customer_type: {
      type: String,
      enum: Object.values(CustomerType),
      required: [true, 'Please add a customer type'],
    },
    erp_code: {
      type: String,
    },
    scap_id: {
      type: String,
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
    is_main_customer: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
    },
    customer_email: {
      type: String,
    },
    manager_name: {
      type: String,
    },
    description: {
      type: String,
    },
    note: {
      type: String,
    },
    order: {
      type: Number,
    },
    parent_customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    administrator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    zipcode: {
      type: String,
    },
    country: {
      type: String,
    },
    phone: {
      type: String,
    },
    code: {
      type: String,
    },
    vat: {
      type: String,
    },
    mapLocation: {
      type: String,
    },
    supercourse_sub_customer_id: {
      type: String,
      required: false,
      index: true,
    },
    products: [
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

CustomerSchema.plugin(toJson);
CustomerSchema.plugin(advancedResultsPlugin);
CustomerSchema.plugin(createdBy);
CustomerSchema.plugin(notificationPlugin, [
  {
    action: 'create',
    title: (doc: ICustomer) => `New Customer ${doc.name} has been created`,
  },
]);
CustomerSchema.plugin(tenantAwarePlugin);

// Post-save hook to emit signals when customer/branch details change
CustomerSchema.post('save', async function (doc, next) {
  try {
    // Emit signal for customer updates that might affect staff assignments
    emitCustomerSignal(StaffAssignmentSignalType.CUSTOMER_UPDATED, {
      customerId: (doc as any)._id.toString(),
      // Note: We could query for affected staff here, but for simplicity
      // the signal handler will determine which staff are affected
    });
  } catch (error) {
    console.error('Error emitting customer signal for staff academic assignments:', error);
  }
  next();
});

// Post-update hook for customer updates
CustomerSchema.post('findOneAndUpdate', async function (doc, next) {
  try {
    if (doc) {
      emitCustomerSignal(StaffAssignmentSignalType.CUSTOMER_UPDATED, {
        customerId: (doc as any)._id.toString(),
      });
    }
  } catch (error) {
    console.error('Error emitting customer update signal for staff academic assignments:', error);
  }
  next();
});

const Customer = mongoose.model<
  ICustomer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<ICustomer>
>('Customer', CustomerSchema);

export default Customer;
export { CustomerSchema };
