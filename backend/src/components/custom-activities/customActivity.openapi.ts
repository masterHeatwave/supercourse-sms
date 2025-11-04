import { patch, put } from 'axios';
import { CustomActivitySchema } from './customActivity-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { Schema, z } from 'zod';

const customActivityResponseSchema = z.object({
  success: z.boolean(),
  data: CustomActivitySchema,
});

export const createCustomActivitySchema = CustomActivitySchema;

const fileSchema = z.object({
  success: z.boolean(),
  data: z.instanceof(FormData),
});

const uploadFromAISchema = z.object({
  success: z.boolean(),
  data: z.object({
    path: z.string().describe('Public path to the uploaded image'),
    filename: z.string().describe('Generated unique filename'),
    originalname: z.string().describe('Original filename or URL basename'),
    mimetype: z.string().describe('MIME type of the image'),
  }),
  message: z.string().describe('Status message'),
});

const uploadImageSchema = z.object({
  media: z.any().openapi({
    type: 'string',
    format: 'binary',
    description: 'The image file to upload',
  }),
});

const deleteImageSchema = z.object({
  url: z.string().url(),
});

export const generateFromAIRequestSchema = z.object({
  query: z.string().openapi({ description: 'The prompt for AI image generation' }),
});

// 2️⃣ Optional: schema for response
export const generateFromAIResponseSchema = z.object({
  success: z.boolean(),
  imagesData: z.string().nullable(),
  messageType: z.string().nullable(),
  message: z.string().nullable(),
});

const customActivityListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    results: z.array(customActivityResponseSchema),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
  }),
});

export const customActivityOpenApi = {
  tags: [
    {
      name: 'Custom-activities',
      description: 'Custom-activities management operations',
    },
  ],
  paths: {
    '/custom-activities': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get all custom activities',
        description: 'Retrieve a list of all custom activities',
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
            description: 'List of custom activities retrieved successfully',
            content: {
              'application/json': {
                schema: customActivityListResponseSchema,
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
        tags: ['Custom-activities'],
        summary: 'Create a new custom activity',
        description: 'Create a new custom activity with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [],
        requestBody: {
          content: {
            'application/json': {
              schema: createCustomActivitySchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Custom activity created successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
    '/custom-activities/saveImage': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Save an image from a custom activity',
        description: 'Uploads an image from a custom activity',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: uploadImageSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    path: z.string(),
                    filename: z.string(),
                    originalname: z.string(),
                    mimetype: z.string(),
                  }),
                  message: z.string(),
                }),
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
    '/custom-activities/deleteImage': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Delete an image from a custom activity',
        description: 'Deletes a file given its full public URL',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: deleteImageSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'File deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  message: z.string(),
                }),
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
          '403': {
            description: 'Unauthorized file path',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/custom-activities/uploadFromURL': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Save an image from a custom activity',
        description: 'Uploads an image from a custom activity',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                url: z.string(),
              }),
            },
          },
        },
        responses: {
          '201': {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: uploadFromAISchema, // converts zod to OpenAPI schema
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
    '/custom-activities/generateFromAI': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Generate an image from AI based on a prompt',
        description: 'Generates an image using AI (DALL-E) from a provided prompt.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: generateFromAIRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Image generated successfully',
            content: {
              'application/json': {
                schema: generateFromAIResponseSchema,
              },
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
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    '/custom-activities/findOnPexels': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Find an image on pexels based on a prompt',
        description: 'Find an image on pexels from a provided prompt.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: generateFromAIRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Image found successfully',
            content: {
              'application/json': {
                schema: generateFromAIResponseSchema,
              },
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
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    '/custom-activities/{activityId}': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get custom activities by id',
        description: 'Retrieve a list of all custom activities',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of custom activities retrieved successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
      put: {
        tags: ['Custom-activities'],
        summary: 'Update a custom activity',
        description: 'Update a custom activity with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: createCustomActivitySchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Custom activity updated successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
      delete: {
        tags: ['Custom-activities'],
        summary: 'Delete a custom activity',
        description: 'Delete a custom activity with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '201': {
            description: 'Custom activity deleted successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
    '/custom-activities/user/{userId}': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get custom activities by user id',
        description: 'Retrieve a list of all custom activities by user id',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of custom activities retrieved successfully',
            content: {
              'application/json': {
                schema: customActivityListResponseSchema,
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
    '/custom-activities/public-activities/{userId}': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get all public custom activities',
        description: "Retrieve a list of public custom activities excluding the userId's",
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for mood name',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of public activities retrieved successfully',
            content: {
              'application/json': {
                schema: customActivityListResponseSchema,
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
    '/custom-activities/duplicate/{activityId}': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Duplicate a custom activity',
        description: 'Duplicate a custom activity by the activity id',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '201': {
            description: 'Custom activity created successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
    '/custom-activities/duplicate-public/{activityId}/user/{userId}': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Duplicate a public custom activity',
        description: 'Duplicate a public custom activity by the activity id and the user id',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
          {
            name: 'userId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '201': {
            description: 'Custom activity created successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
    '/custom-activities/student-activities/user/{userId}': {
      get: {
        tags: ['Custom-activities'],
        summary: "Get student's custom activities by id",
        description: 'Retrieve a list of students custom activities',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of student custom activities retrieved successfully',
            content: {
              'application/json': {
                schema: customActivityResponseSchema,
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
