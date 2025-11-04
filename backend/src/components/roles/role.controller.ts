import { asyncHandler } from '@middleware/async';
import roleService from './role.service';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { createSchema } from '@components/roles/role-validate.schemas';
import { IRole, IRoleCreateDTO } from './role.interface';

const queryAll = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const params = req.query;
  const roles = await roleService.queryAll(params);
  jsonResponse(res, {
    status: StatusCodes.OK,
    data: roles,
    success: true,
  });
});

const create = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const data = createSchema.parse(req.body);
  const savedRoles: IRole[] = [];

  for (const role of data.roles) {
    if (role.title !== 'CUSTOM') {
      const roleExists = await roleService.queryByTitle(role.title);
      if (roleExists) {
        savedRoles.push(roleExists);
      }
      continue;
    }

    const userToSaveObj: IRoleCreateDTO = {
      title: roleService.genCustomRoleName(),
      description: role.description || '',
      permissions: role.permissions?.map((permission) => permission.id) || [],
    };

    const savedRole = await roleService.create(userToSaveObj);
    savedRoles.push(savedRole);
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: savedRoles,
    success: true,
  });
});

export default {
  queryAll,
  create,
};
