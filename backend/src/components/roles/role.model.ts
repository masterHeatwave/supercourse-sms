import mongoose, { Schema } from 'mongoose';
import { IRole } from '@components/roles/role.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { tenantAwarePlugin } from '@plugins/tenantAware';

const RoleSchema: Schema<IRole> = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
  },
  {
    timestamps: true,
  }
);

RoleSchema.plugin(toJson);
RoleSchema.plugin(advancedResultsPlugin);
RoleSchema.plugin(tenantAwarePlugin);

const Role = mongoose.model<IRole, IAdvancedResultsModel<any>>('Role', RoleSchema);
export default Role;
export { RoleSchema };
