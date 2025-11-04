import {
  createSessionSchema,
  updateSessionSchema,
  addStudentSchema,
  removeStudentSchema,
  addTeacherSchema,
  removeTeacherSchema,
  SessionSchema,
  OSTokenSchema,
} from './session-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';
import { SuccessResponseSchema, ErrorResponseSchema } from '@components/auth/auth-validate.schemas';

const sessionResponseSchema = SuccessResponseSchema.extend({
  data: SessionSchema,
});

const sessionsPaginatedResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    results: z.array(SessionSchema),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
  }),
});

const OSTokenResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    token: z.string().min(1),
  }),
});

export const sessionOpenApi = {
  tags: [
    {
      name: 'Sessions',
      description: 'Session management operations',
    },
  ],
  paths: {
    '/sessions': {
      get: {
        tags: ['Sessions'],
        summary: 'Get all sessions',
        description: 'Retrieve a list of all sessions with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'taxi',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by taxi',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: "Filter by taxi's branch",
          } as ParameterObject,
          {
            name: 'classroom',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by classroom',
          } as ParameterObject,
          {
            name: 'academic_period',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic period',
          } as ParameterObject,
          {
            name: 'academic_subperiod',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic subperiod',
          } as ParameterObject,
          {
            name: 'teacher',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by teacher',
          } as ParameterObject,
          {
            name: 'student',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by student',
          } as ParameterObject,
          {
            name: 'from_date',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by start date',
          } as ParameterObject,
          {
            name: 'to_date',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by end date',
          } as ParameterObject,
          {
            name: 'is_recurring',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by recurring status',
          } as ParameterObject,
          {
            name: 'mode',
            in: 'query',
            schema: { type: 'string', enum: ['in_person', 'online', 'hybrid'] },
            description: 'Filter by session mode',
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
            description: 'Sort order, e.g., -start_date or start_date',
          } as ParameterObject,
          {
            name: 'select',
            in: 'query',
            schema: { type: 'string' },
            description: 'Comma-separated fields to include',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of sessions retrieved successfully',
            content: {
              'application/json': {
                schema: sessionsPaginatedResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      post: {
        tags: ['Sessions'],
        summary: 'Create a new session',
        description: 'Create a new session with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createSessionSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Session created successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/{id}': {
      get: {
        tags: ['Sessions'],
        summary: 'Get session by ID',
        description: 'Retrieve details of a specific session by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Session ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Session details retrieved successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      put: {
        tags: ['Sessions'],
        summary: 'Update session',
        description: 'Update details of a specific session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Session ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateSessionSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Session updated successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Sessions'],
        summary: 'Delete session',
        description: 'Delete a specific session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Session ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Session deleted successfully',
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/add-student': {
      post: {
        tags: ['Sessions'],
        summary: 'Add student to session',
        description: 'Add a student to a specific session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: addStudentSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Student added successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session or student not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/remove-student': {
      post: {
        tags: ['Sessions'],
        summary: 'Remove student from session',
        description: 'Remove a student from a specific session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: removeStudentSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Student removed successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session or student not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/add-teacher': {
      post: {
        tags: ['Sessions'],
        summary: 'Add teacher to session',
        description: 'Add a teacher to a specific session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: addTeacherSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Teacher added successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session or teacher not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/remove-teacher': {
      post: {
        tags: ['Sessions'],
        summary: 'Remove teacher from session',
        description: 'Remove a teacher from a specific session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: removeTeacherSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Teacher removed successfully',
            content: {
              'application/json': {
                schema: sessionResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Session or teacher not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/preview': {
      get: {
        tags: ['Sessions'],
        summary: 'Preview recurring sessions',
        description: 'Get a preview of sessions that would be generated for given parameters',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'day',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            },
            description: 'Day of the week',
          } as ParameterObject,
          {
            name: 'start_date',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
            description: 'Start date for the recurring sessions',
          } as ParameterObject,
          {
            name: 'end_date',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
            description: 'End date for the recurring sessions',
          } as ParameterObject,
          {
            name: 'frequency',
            in: 'query',
            required: true,
            schema: { type: 'integer', minimum: 1, maximum: 52 },
            description: 'Frequency in weeks',
          } as ParameterObject,
          {
            name: 'start_time',
            in: 'query',
            required: true,
            schema: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
            description: 'Start time in HH:MM format',
          } as ParameterObject,
          {
            name: 'duration',
            in: 'query',
            required: true,
            schema: { type: 'number', minimum: 0.5, maximum: 24 },
            description: 'Duration in hours',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Session preview generated successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema.extend({
                  data: z.object({
                    preview: z.array(
                      z.object({
                        date: z.string(),
                        startDate: z.string(),
                        endDate: z.string(),
                        dayOfWeek: z.string(),
                      })
                    ),
                    totalSessions: z.number(),
                    summary: z.object({
                      day: z.string(),
                      frequency: z.string(),
                      duration: z.string(),
                      startTime: z.string(),
                      dateRange: z.object({
                        start: z.string(),
                        end: z.string(),
                      }),
                    }),
                  }),
                }),
              },
            },
          },
          '400': {
            description: 'Bad request - Invalid parameters',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/sessions/online-session-token': {
      post: {
        tags: ['Sessions'],
        summary: 'Create a token (JWT) for online session',
        description: 'Create a specific token for online session',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: OSTokenSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Token created successfully',
            content: {
              'application/json': {
                schema: OSTokenResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
  },
};
