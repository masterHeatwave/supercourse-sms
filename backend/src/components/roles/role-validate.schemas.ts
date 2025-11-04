import 'zod-openapi/extend';
import { z } from 'zod';

export const RoleSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    permissions: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
        })
      )
      .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Role',
    description: 'Role model',
  });

export const PermissionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Permission',
    description: 'Permission model',
  });

const createSchema = z
  .object({
    roles: z.array(
      z.object({
        id: z.string().min(3),
        title: z.string().min(3),
        description: z.string().optional(),
        permissions: z
          .array(
            z.object({
              id: z.string().min(3),
              name: z.string().min(3),
              description: z.string().optional(),
            })
          )
          .optional(),
      })
    ),
  })
  .openapi({
    title: 'CreateRoles',
    description: 'Schema for creating roles',
  });

export { createSchema };
