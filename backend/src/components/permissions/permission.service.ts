import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import Permission from '@components/permissions/permission.model';
import { logger } from '@utils/logger';
import { IAsyncPermission } from '@middleware/async.interface';
import { IRole } from '@components/roles/role.interface';
import { IPermission } from '@components/permissions/permission.interface';

const getAllPermissions = (dir: string): IAsyncPermission[] => {
  let permissions: IAsyncPermission[] = [];

  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      permissions = permissions.concat(getAllPermissions(filePath));
    } else if (file.endsWith('.routes.ts')) {
      logger.info(`Checking file ${file}`);
      const content = readFileSync(filePath, 'utf-8');
      const matches = content.match(/authorize\('([^']+)'\)/g);
      if (matches) {
        matches.forEach((match) => {
          const action_key = match.match(/authorize\('([^']+)'\)/)?.[1];
          if (action_key) {
            permissions.push({ action_key, description: 'No description provided' });
          }
        });
      }
    }
  }

  return permissions;
};

const registerAllPermissions = async (permissions: IAsyncPermission[]) => {
  const existingPermissions = await Permission.find({});

  const newPermissionSet = new Set(permissions.map((p) => p.action_key));

  for (const existingPermission of existingPermissions) {
    if (!newPermissionSet.has(existingPermission.name)) {
      await Permission.deleteOne({ _id: existingPermission._id });
      logger.info(`Permission ${existingPermission.name} deleted as it's no longer needed`);
    }
  }

  for (const permission of permissions) {
    const { action_key, description } = permission;

    const existingPermission = await Permission.findOne({ name: action_key });
    if (existingPermission) {
      if (existingPermission.description !== description) {
        existingPermission.description = description;
        await existingPermission.save();
        logger.info(`Permission ${action_key} description updated`);
      } else {
        logger.info(`Permission ${action_key} already exists and is up to date`);
      }
    } else {
      await Permission.create({ name: action_key, description });
      logger.info(`Permission ${action_key} created successfully`);
    }
  }
};

const doesPermissionsExistInUserRoles = async (actionKey: string, roles: IRole[]) => {
  for (const role of roles) {
    const permissions = role.permissions;
    if (permissions.some((permission) => permission.name === actionKey)) {
      return true;
    }
  }

  return false;
};

const queryAllPermissions = async (): Promise<IPermission[]> => {
  return await Permission.find({});
};

const queryPermission = async (actionKey: string): Promise<IPermission | null> => {
  return await Permission.findOne({ name: actionKey });
};

export default {
  registerAllPermissions,
  getAllPermissions,
  doesPermissionsExistInUserRoles,
  queryAllPermissions,
  queryPermission,
};
