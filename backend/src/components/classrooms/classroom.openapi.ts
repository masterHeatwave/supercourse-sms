import { createClassroomSchema, updateClassroomSchema, ClassroomSchema } from './classroom-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const classroomResponseSchema = z.object({
  success: z.boolean(),
  data: ClassroomSchema,
});

const classroomsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    results: z.array(ClassroomSchema),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
  }),
});

export const classroomOpenApi = {
  tags: [
    {
      name: 'Classrooms',
      description: 'Classroom management operations',
    },
  ],
  paths: {
    '/classrooms': {
      get: {
        tags: ['Classrooms'],
        summary: 'Get all classrooms',
        description: 'Retrieve a list of all classrooms with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search term for classroom name',
          } as ParameterObject,
          {
            name: 'location',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by location',
          } as ParameterObject,
          {
            name: 'equipment',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by equipment',
          } as ParameterObject,
          {
            name: 'minCapacity',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by minimum capacity',
          } as ParameterObject,
          {
            name: 'available_day',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by available day',
          } as ParameterObject,
          {
            name: 'available_time',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by available time',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of results per page',
          } as ParameterObject,
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
            description: 'Sort order',
          } as ParameterObject,
          {
            name: 'select',
            in: 'query',
            schema: { type: 'string' },
            description: 'Comma-separated fields to include',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description:
              'Filter by branch ID. If not provided, returns classrooms for all branches of the current tenant',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of classrooms retrieved successfully',
            content: {
              'application/json': {
                schema: classroomsListResponseSchema,
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
        tags: ['Classrooms'],
        summary: 'Create a new classroom',
        description: 'Create a new classroom with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createClassroomSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Classroom created successfully',
            content: {
              'application/json': {
                schema: classroomResponseSchema,
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
    '/classrooms/{id}': {
      get: {
        tags: ['Classrooms'],
        summary: 'Get classroom by ID',
        description: 'Retrieve details of a specific classroom by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Classroom ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Classroom details retrieved successfully',
            content: {
              'application/json': {
                schema: classroomResponseSchema,
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
            description: 'Classroom not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Classrooms'],
        summary: 'Update classroom',
        description: 'Update details of a specific classroom',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Classroom ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateClassroomSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Classroom updated successfully',
            content: {
              'application/json': {
                schema: classroomResponseSchema,
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
            description: 'Classroom not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Classrooms'],
        summary: 'Delete classroom',
        description: 'Delete a specific classroom',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Classroom ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Classroom deleted successfully',
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
            description: 'Classroom not found',
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
