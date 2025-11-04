import { createSchema, RoleSchema } from './role-validate.schemas';
import { z } from 'zod';

const rolesListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(RoleSchema),
});

export const roleOpenApi = {
  tags: [
    {
      name: 'Roles',
      description: 'Role management operations',
    },
  ],
  paths: {
    '/roles': {
      get: {
        tags: ['Roles'],
        summary: 'Get all roles',
        description: 'Retrieve a list of all roles',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'List of roles retrieved successfully',
            content: {
              'application/json': {
                schema: rolesListResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Roles'],
        summary: 'Create new roles',
        description: 'Create new roles with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Roles created successfully',
            content: {
              'application/json': {
                schema: rolesListResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
};
