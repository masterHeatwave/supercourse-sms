import { Schema } from 'mongoose';
import UserSchema from '@components/users/user.model';
import { IRole } from '@components/roles/role.interface';

export function userContextPlugin(schema: Schema) {
  Object.defineProperty(schema, 'currentUser', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: undefined,
  });

  schema.methods.canEdit = async function (this: any): Promise<boolean> {
    const currentUser = this.schema.currentUser;

    if (!currentUser) {
      return true;
    }

    if (this.createdBy) {
      if (this.createdBy.toString() === currentUser?.id.toString()) {
        return true;
      }

      const creator = await UserSchema.findById(this.createdBy).populate('roles').select('roles');
      const currentUserRoles = currentUser?.roles;

      const isCreatorAdmin = creator?.roles.some((role: IRole) => role.title === 'admin');
      const isCurrentUserAdmin = currentUserRoles?.some((role: IRole) => role.title === 'admin');

      if (!isCreatorAdmin || !isCurrentUserAdmin) {
        return false;
      }
    }

    return true;
  };

  // Method to set the current user
  schema.statics.setCurrentUser = function (userId: string) {
    this.schema.currentUser = userId;
  };

  // Method to get the current user
  schema.statics.getCurrentUser = function (): string | undefined {
    return this.schema.currentUser;
  };

  schema.pre('findOneAndUpdate', async function (this: any, next) {
    try {
      const currentUser = this.schema.currentUser;

      if (!currentUser) {
        return next();
      }

      const docToUpdate = await this.model.findById(this.getQuery());

      if (!docToUpdate) {
        return next();
      }

      if (docToUpdate.createdBy) {
        if (docToUpdate.createdBy.toString() === currentUser?.id.toString()) {
          return next(); // Allow update if user is the creator
        }

        const UserModel = this.model.db.model('User');

        const creator = await UserModel.findById(docToUpdate.createdBy).populate('roles').select('roles');

        const currentUserRoles = currentUser?.roles;

        const isCreatorAdmin = creator?.roles.some((role: IRole) => role.title === 'admin');
        const isCurrentUserAdmin = currentUserRoles?.some((role: IRole) => role.title === 'admin');

        if (!isCreatorAdmin || !isCurrentUserAdmin) {
          throw new Error('Unauthorized: Only admins can modify admin-created records');
        }
      }

      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Unknown error in userContext plugin'));
    }
  });
}
