import mongoose, { Schema } from 'mongoose';
import { IPermission } from '@components/permissions/permission.interface';
import toJson from '../../plugins/toJson';

const PermissionSchema: Schema<IPermission> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PermissionSchema.plugin(toJson);

export default mongoose.model<IPermission>('Permission', PermissionSchema);

export { PermissionSchema };
