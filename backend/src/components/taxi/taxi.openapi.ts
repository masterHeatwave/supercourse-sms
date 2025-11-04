import {
  createTaxiSchema,
  updateTaxiSchema,
  addUserSchema,
  removeUserSchema,
  TaxiSchema,
  TaxiAttendanceSchema,
} from './taxi-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const taxiResponseSchema = z.object({
  success: z.boolean(),
  data: TaxiSchema,
});

const taxisListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  data: z.array(TaxiSchema),
});

export const taxiOpenApi = {
  tags: [
    {
      name: 'Taxis',
      description: 'Taxi management operations',
    },
  ],
  paths: {
    '/taxis': {
      get: {
        tags: ['Taxis'],
        summary: 'Get all taxis',
        description: 'Retrieve a list of all taxis with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'academic_year',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic year ID',
          } as ParameterObject,
          {
            name: 'academic_period',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic period ID',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch',
          } as ParameterObject,
          {
            name: 'subject',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by subject',
          } as ParameterObject,
          {
            name: 'level',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by level',
          } as ParameterObject,
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search term for taxi name',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of taxis retrieved successfully',
            content: {
              'application/json': {
                schema: taxisListResponseSchema,
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
        tags: ['Taxis'],
        summary: 'Create a new taxi',
        description: 'Create a new taxi with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createTaxiSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Taxi created successfully',
            content: {
              'application/json': {
                schema: taxiResponseSchema,
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
    '/taxis/{id}': {
      get: {
        tags: ['Taxis'],
        summary: 'Get taxi by ID',
        description: 'Retrieve details of a specific taxi by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Taxi ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Taxi details retrieved successfully',
            content: {
              'application/json': {
                schema: taxiResponseSchema,
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
          '404': {
            description: 'Taxi not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Taxis'],
        summary: 'Update taxi',
        description: 'Update details of a specific taxi',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Taxi ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateTaxiSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Taxi updated successfully',
            content: {
              'application/json': {
                schema: taxiResponseSchema,
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
          '404': {
            description: 'Taxi not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Taxis'],
        summary: 'Delete taxi',
        description: 'Delete a specific taxi',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Taxi ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Taxi deleted successfully',
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Taxi not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/taxis/{id}/attendance': {
      get: {
        tags: ['Taxis'],
        summary: 'Get taxi attendance',
        description: 'Retrieve aggregated attendance (recent sessions) for a taxi/class',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Taxi ID',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Max dates to include (default 10, max 60)',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Taxi attendance retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean(), data: TaxiAttendanceSchema }),
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Taxi not found' },
        },
      },
    },
    '/taxis/user/{userId}': {
      get: {
        tags: ['Taxis'],
        summary: 'Get taxis by user ID',
        description: 'Retrieve all taxis where a specific user is a member',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Taxis retrieved successfully',
            content: {
              'application/json': {
                schema: taxisListResponseSchema,
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
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/taxis/add-user': {
      post: {
        tags: ['Taxis'],
        summary: 'Add user to taxi',
        description: 'Add a user to a specific taxi',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: addUserSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User added to taxi successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Taxi or user not found',
          },
        },
      },
    },
    '/taxis/remove-user': {
      post: {
        tags: ['Taxis'],
        summary: 'Remove user from taxi',
        description: 'Remove a user from a specific taxi',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: removeUserSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User removed from taxi successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Taxi or user not found',
          },
        },
      },
    },
  },
};
