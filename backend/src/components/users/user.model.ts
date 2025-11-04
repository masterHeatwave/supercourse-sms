import mongoose, { Schema } from 'mongoose';
import { config } from '@config/config';
import toJson from '../../plugins/toJson';
import { IUser, IUserType } from '@components/users/user.interface';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';
import { activityTrackerPlugin } from '@plugins/activityTracker';
import { ActivityEntityType, ActivityActionType } from '@components/activity/activity.interface';
import {
  emitUserSignal,
  StaffAssignmentSignalType,
} from '@components/staff-academic-assignments/staff-academic-assignments.signals';
tenantAwarePlugin(mongoose.Schema.prototype);

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [config.AUTH.LOGIN_STRATEGY === 'usernameLoginStrategy', 'Please add a username'],
      unique: true,
      sparse: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
    },
    firstname: {
      type: String,
      required: [true, 'Please add a first name'],
    },
    lastname: {
      type: String,
      required: [true, 'Please add a last name'],
    },
    email: {
      type: String,
      required: [config.AUTH.LOGIN_STRATEGY === 'emailLoginStrategy', 'Please add email'],
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: [config.AUTH.LOGIN_STRATEGY === 'smsLoginStrategy', 'Please add phone'],
      unique: true,
      sparse: true,
    },
    mobile: {
      type: String,
      required: [true, 'Please add a mobile number'],
      unique: true,
      sparse: true,
    },
    city: {
      type: String,
    },
    region: {
      type: String,
    },
    country: {
      type: String,
    },
    address: {
      type: String,
    },
    zipcode: {
      type: String,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    birthday: {
      type: Date,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    customers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
    taxis: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxi',
      },
    ],
    user_type: {
      type: String,
      enum: Object.values(IUserType),
      required: true,
    },
    avatar: {
      type: String,
    },
    branches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    default_branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    role_title: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    hire_date: {
      type: Date,
    },
    facebook_link: {
      type: String,
    },
    twitter_link: {
      type: String,
    },
    linkedin_link: {
      type: String,
    },
    documents: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    // Student-specific fields
    contacts: [
      {
        name: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        relationship: {
          type: String,
          required: true,
        },
        isPrimaryContact: {
          type: Boolean,
          default: false,
        },
      },
    ],
    siblingAttending: [
      {
        type: String,
      },
    ],
    hasAllergies: {
      type: Boolean,
      default: false,
    },
    healthDetails: {
      type: String,
    },
    generalNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.index({ user_type: 1 });
// Index for quickly finding students by a parent's contact email
UserSchema.index({ 'contacts.email': 1 });

UserSchema.virtual('teaching_sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'teachers',
});

UserSchema.virtual('student_sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'students',
});

UserSchema.virtual('primaryRoleTitle').get(function (this: IUser) {
  if (this.roles?.[0] && typeof this.roles[0] === 'object') {
    return this.roles[0]?.title || '';
  }
  return '';
});

UserSchema.virtual('class').get(function (this: IUser) {
  if (this.taxis?.[0] && typeof this.taxis[0] === 'object') {
    return this.taxis[0]?.name || '';
  }
  return '';
});

UserSchema.plugin(toJson);
UserSchema.plugin(advancedResultsPlugin);
UserSchema.plugin(activityTrackerPlugin, {
  entityType: ActivityEntityType.USER,
  entityNameField: 'username',
  actions: [ActivityActionType.CREATE, ActivityActionType.UPDATE, ActivityActionType.DELETE],
});

UserSchema.pre('save', function (next) {
  if (!this.default_branch && this.branches && this.branches.length > 0) {
    this.default_branch = this.branches[0];
  }

  // Generate username from firstname and lastname if not provided
  if (!this.username && this.firstname && this.lastname) {
    this.username = `${this.firstname.toLowerCase()}.${this.lastname.toLowerCase()}`;
  }

  next();
});

// Post-save hook to emit signals for staff academic assignment sync
UserSchema.post('save', async function (doc, next) {
  try {
    // Only emit signals for staff members (not students or parents)
    if ([IUserType.ADMIN, IUserType.MANAGER, IUserType.TEACHER].includes(doc.user_type)) {
      emitUserSignal(StaffAssignmentSignalType.USER_CREATED, {
        userId: (doc as any)._id.toString(),
        userType: doc.user_type,
        currentData: {
          roles: doc.roles?.map((role: any) => role.toString()) || [],
          branches: doc.branches?.map((branch: any) => branch.toString()) || [],
          taxis: doc.taxis?.map((taxi: any) => taxi.toString()) || [],
        },
      });
    }
  } catch (error) {
    console.error('Error emitting user signal for staff academic assignments:', error);
    // Don't fail the user save operation if signal emission fails
  }
  next();
});

// Post-update hook to emit signals for staff academic assignment sync
UserSchema.post('findOneAndUpdate', async function (doc, next) {
  try {
    if (doc && [IUserType.ADMIN, IUserType.MANAGER, IUserType.TEACHER].includes(doc.user_type)) {
      emitUserSignal(StaffAssignmentSignalType.USER_UPDATED, {
        userId: (doc as any)._id.toString(),
        userType: doc.user_type,
        currentData: {
          roles: doc.roles?.map((role: any) => role.toString()) || [],
          branches: doc.branches?.map((branch: any) => branch.toString()) || [],
          taxis: doc.taxis?.map((taxi: any) => taxi.toString()) || [],
        },
      });
    }
  } catch (error) {
    console.error('Error emitting user update signal for staff academic assignments:', error);
    // Don't fail the user update operation if signal emission fails
  }
  next();
});

const User = mongoose.model<IUser, IAdvancedResultsModel<IUser>>('User', UserSchema);

export default User;

export { UserSchema };
