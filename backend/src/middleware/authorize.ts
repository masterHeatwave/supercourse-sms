import { ErrorResponse } from '@utils/errorResponse';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './async';
import { config } from '@config/config';
import { StatusCodes } from 'http-status-codes';
import User from '@components/users/user.model';
import jwt from 'jsonwebtoken';
import { IRole } from '@components/roles/role.interface';
import permissionService from '@components/permissions/permission.service';
import { jsonResponse } from './json-response';
import roleService from '@components/roles/role.service';
import Customer from '@components/customers/customer.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Role from '@components/roles/role.model';
import { logger } from '@utils/logger';

// Helper function to create unauthorized response
const createUnauthorizedResponse = (res: Response, message: string) => {
  return jsonResponse(res, {
    status: StatusCodes.UNAUTHORIZED,
    message,
    success: false,
    error: 'Unauthorized',
  });
};

// Helper function to create forbidden response
const createForbiddenResponse = (res: Response, message: string) => {
  return jsonResponse(res, {
    status: StatusCodes.FORBIDDEN,
    message,
    success: false,
    error: 'Forbidden',
  });
};

export const apiKeyAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const excludedRoutes = ['/ping', '/v1/authenticate', '/v1/register', '/v1/verify-email', '/v1/refresh', '/docs'];
  const excludedPrefixes = ['/public/'];

  if (excludedRoutes.includes(req.path) || excludedPrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }

  if (req.header('c-api-key') !== config.API_KEY) {
    throw new ErrorResponse('Forbidden', StatusCodes.FORBIDDEN);
  }
  next();
});

export const tenantContext = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const customerSlug = req.header('x-customer-slug');

  if (!customerSlug) {
    return next();
  }

  const customer = await Customer.findOne({ slug: customerSlug });
  if (!customer) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: `Customer with slug '${customerSlug}' not found`,
      success: false,
      error: 'Bad Request',
    });
  }

  return await requestContextLocalStorage.run(customerSlug, async () => {
    req.customerSlug = customerSlug;
    req.customer = customer;
    next();
  });
});

export const authorize = (roles?: string[] | string, permissionKey?: string) => {
  return [
    tenantContext,
    async (req: Request, res: Response, next: NextFunction) => {
      const authString = req.headers['x-ss-auth'] as string;

      if (!authString || authString.trim() === '') {
        return createUnauthorizedResponse(res, 'Not x-ss-auth header provided');
      }

      const splittedAuthString = authString.trim().split(':');

      if (splittedAuthString.length !== 3) {
        return createUnauthorizedResponse(
          res,
          'Invalid x-ss-auth header format. Expected format: roleId:jwtToken:userId'
        );
      }

      const [roleId, jwtToken, userId] = splittedAuthString;

      if (!roleId || !jwtToken || !userId) {
        return createUnauthorizedResponse(
          res,
          'Invalid x-ss-auth header format. Expected format: roleId:jwtToken:userId'
        );
      }

      const fetchedRole = await roleService.querySingle(roleId);
      if (!fetchedRole) {
        return createUnauthorizedResponse(res, 'Role id provided does not exist');
      }

      try {
        jwt.verify(jwtToken, config.JWT_SECRET);

        const fetchedUser = await User.findById(userId);
        if (!fetchedUser) {
          return createUnauthorizedResponse(res, 'User with that id provided does not exist');
        }

        if (!fetchedUser.roles || fetchedUser.roles.length === 0) {
          logger.warn(`User ${fetchedUser.email} has no roles assigned`);
          if (fetchedUser.user_type === 'admin') {
            const adminRole = await Role.findOne({ title: 'ADMIN' });
            if (adminRole) {
              fetchedUser.roles = [adminRole];
              await fetchedUser.save();
              logger.info(`Added ADMIN role to user ${fetchedUser.email}`);
            }
          }
        }

        const userWithRoles = await User.findById(userId).populate({
          path: 'roles',
          model: Role,
          populate: {
            path: 'permissions',
          },
        });

        if (!userWithRoles) {
          return createUnauthorizedResponse(res, 'User with populated roles not found');
        }

        req.user = userWithRoles;

        if (req.customerSlug && req.customer) {
          const hasAccessToCustomer = userWithRoles.customers.some(
            (customer: any) =>
              customer.slug === req.customerSlug || customer._id.toString() === req.customer._id.toString()
          );

          const isAdmin = userWithRoles.roles.some((role: IRole) => role.title === 'ADMIN');

          if (!hasAccessToCustomer && !isAdmin) {
            return createForbiddenResponse(res, `You do not have access to customer/tenant: ${req.customerSlug}`);
          }
        }

        if (userWithRoles.roles.some((role: IRole) => role.title === 'ADMIN')) {
          return next();
        }

        if (roles) {
          const allowedRoles = Array.isArray(roles) ? roles : [roles];

          const hasRole = userWithRoles.roles.some((role: IRole) => {
            // Handle PARENT alias for backward compatibility
            if (role.title === 'PARENT' && allowedRoles.includes('PARENT_GUARDIAN')) {
              return true;
            }
            if (role.title === 'PARENT_GUARDIAN' && allowedRoles.includes('PARENT')) {
              return true;
            }
            return allowedRoles.includes(role.title);
          });

          if (!hasRole) {
            return createForbiddenResponse(res, 'You do not have the required role to access this resource');
          }
        }

        if (permissionKey) {
          const userRoles = userWithRoles.roles;
          if (userRoles) {
            const hasPermission = await permissionService.doesPermissionsExistInUserRoles(permissionKey, userRoles);
            if (!hasPermission) {
              return createForbiddenResponse(res, 'Insufficient permissions');
            }
          }
        }

        next();
      } catch (error) {
        logger.error('Error during authorization:', error);
        return createUnauthorizedResponse(res, 'JWT Token is Invalid');
      }
    },
  ];
};

declare module 'express' {
  interface Request {
    user?: any;
    customerSlug?: string;
    customer?: any;
    originalFilePaths?: Record<
      string,
      {
        originalPath: string;
        tempPath: string;
        filename: string;
      }
    >;
  }
}
