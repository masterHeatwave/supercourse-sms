import { patch } from 'axios';
import { createMoodSchema, MoodSchema, MoodVideoSchema, registerMoodVideoSchema } from './mood-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const moodResponseSchema = z.object({
  success: z.boolean(),
  data: MoodSchema,
});

const moodVideoResponseSchema = z.object({
  success: z.boolean(),
  data: MoodVideoSchema,
});

const moodVideoListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    results: z.array(MoodVideoSchema),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
  }),
});

const moodListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    results: z.array(MoodSchema),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
  }),
});

export const moodOpenApi = {
  tags: [
    {
      name: 'Moods',
      description: 'Mood management operations',
    },
  ],
  paths: {
    '/moods': {
      get: {
        tags: ['Moods'],
        summary: 'Get all moods',
        description: 'Retrieve a list of all moods',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          /*{
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search term for mood name',
          } as ParameterObject,*/
        ],
        responses: {
          '200': {
            description: 'List of moods retrieved successfully',
            content: {
              'application/json': {
                schema: moodListResponseSchema,
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
        tags: ['Moods'],
        summary: 'Create a new mood',
        description: 'Create a new mood with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createMoodSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Mood created successfully',
            content: {
              'application/json': {
                schema: moodResponseSchema,
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
    '/moods/{id}': {
      get: {
        tags: ['Moods'],
        summary: 'Get mood by ID',
        description: 'Retrieve details of a specific mood by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Mood ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Mood details retrieved successfully',
            content: {
              'application/json': {
                schema: moodResponseSchema,
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
            description: 'Mood not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/moods/user/{userId}': {
      get: {
        tags: ['Moods'],
        summary: 'Get mood by user ID',
        description: 'Retrieve details of a specific mood by user ID',
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
            description: 'Mood details retrieved successfully',
            content: {
              'application/json': {
                schema: moodResponseSchema,
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
            description: 'Mood not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/moods/user/{userId}/class/{classId}': {
      get: {
        tags: ['Moods'],
        summary: 'Get mood by user ID and class ID',
        description: 'Retrieve details of a specific mood by user ID and class ID',
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
            name: 'classId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Class ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Mood details retrieved successfully',
            content: {
              'application/json': {
                schema: moodResponseSchema,
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
            description: 'Mood not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/moods/getVideosByType/{videoType}': {
      get: {
        tags: ['Moods'],
        summary: 'Get mood videos by type',
        description: 'Retrieve details of a specific mood video by type',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'videoType',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Video type',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Mood videos retrieved successfully',
            content: {
              'application/json': {
                schema: moodVideoResponseSchema,
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
            description: 'Mood videos not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/moods/getVideoById/{videoId}': {
      get: {
        tags: ['Moods'],
        summary: 'Get mood video by id',
        description: 'Retrieve details of a specific mood video by id',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'videoId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Video type',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Mood video retrieved successfully',
            content: {
              'application/json': {
                schema: moodVideoResponseSchema,
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
            description: 'Mood video not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/moods/getBestVideos': {
      get: {
        tags: ['Moods'],
        summary: 'Get best videos',
        description: 'Retrieve a list of the top 5 mood videos',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          /*{
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search term for mood name',
          } as ParameterObject,*/
        ],
        responses: {
          '200': {
            description: 'List of moods retrieved successfully',
            content: {
              'application/json': {
                schema: moodVideoListResponseSchema,
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
    '/moods/registerView/{videoId}': {
      patch: {
        tags: ['Moods'],
        summary: 'Register mood video view',
        description: 'Increases mood video view count',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'videoId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Video type',
          } as ParameterObject,
        ],
        responses: {
          '201': {
            description: 'Mood video view increased successfully',
            content: {
              'application/json': {
                schema: moodVideoResponseSchema,
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
