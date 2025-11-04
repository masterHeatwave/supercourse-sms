import { ActivitySchema, createActivitySchema } from './activity-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const activityResponseSchema = z.object({
  success: z.boolean(),
  data: ActivitySchema,
});

const activitiesListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  data: z.array(ActivitySchema),
});

export const activityOpenApi = {
  tags: [
    {
      name: 'Activity',
      description: 'Activity tracking operations',
    },
  ],
  paths: {
    '/activity': {
      get: {
        tags: ['Activity'],
        summary: 'Get all activities',
        description: 'Retrieve a list of all activity records with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'action_type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['create', 'update', 'delete'],
            },
            description: 'Filter by action type',
          } as ParameterObject,
          {
            name: 'entity_type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['user', 'student', 'taxi', 'post', 'session', 'classroom', 'absence'],
            },
            description: 'Filter by entity type',
          } as ParameterObject,
          {
            name: 'entity_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by entity ID',
          } as ParameterObject,
          {
            name: 'performed_by',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by user who performed the action',
          } as ParameterObject,
          {
            name: 'from_date',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by creation date (from)',
          } as ParameterObject,
          {
            name: 'to_date',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by creation date (to)',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number' },
            description: 'Limit the number of records returned',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of activities retrieved successfully',
            content: {
              'application/json': {
                schema: activitiesListResponseSchema,
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
        tags: ['Activity'],
        summary: 'Create a new activity record',
        description: 'Create a new activity record with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createActivitySchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Activity record created successfully',
            content: {
              'application/json': {
                schema: activityResponseSchema,
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
    '/activity/{id}': {
      get: {
        tags: ['Activity'],
        summary: 'Get activity by ID',
        description: 'Retrieve details of a specific activity record by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Activity ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Activity details retrieved successfully',
            content: {
              'application/json': {
                schema: activityResponseSchema,
              },
            },
          },
          '404': {
            description: 'Activity not found',
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
    '/activity/recent': {
      get: {
        tags: ['Activity'],
        summary: 'Get recent activities',
        description: 'Retrieve a list of recent activity records',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number' },
            description: 'Limit the number of records returned',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of recent activities retrieved successfully',
            content: {
              'application/json': {
                schema: activitiesListResponseSchema,
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
    '/activity/dashboard': {
      get: {
        tags: ['Activity'],
        summary: 'Get dashboard activities',
        description: 'Retrieve a list of activity records for the dashboard',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number' },
            description: 'Limit the number of records returned',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of dashboard activities retrieved successfully',
            content: {
              'application/json': {
                schema: activitiesListResponseSchema,
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
    '/activity/entity/{entityId}': {
      get: {
        tags: ['Activity'],
        summary: 'Get activities by entity ID',
        description: 'Retrieve a list of activity records for a specific entity',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'entityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Entity ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of activities for the entity retrieved successfully',
            content: {
              'application/json': {
                schema: activitiesListResponseSchema,
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
    '/activity/entity/{entityId}/{entityType}': {
      get: {
        tags: ['Activity'],
        summary: 'Get activities by entity ID and type',
        description: 'Retrieve a list of activity records for a specific entity and type',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'entityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Entity ID',
          } as ParameterObject,
          {
            name: 'entityType',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['user', 'student', 'taxi', 'post', 'session', 'classroom', 'absence'],
            },
            description: 'Entity Type',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of activities for the entity and type retrieved successfully',
            content: {
              'application/json': {
                schema: activitiesListResponseSchema,
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
    '/activity/user/{userId}': {
      get: {
        tags: ['Activity'],
        summary: 'Get activities by user',
        description: 'Retrieve a list of activity records performed by a specific user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number' },
            description: 'Limit the number of records returned',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of activities for the user retrieved successfully',
            content: {
              'application/json': {
                schema: activitiesListResponseSchema,
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
