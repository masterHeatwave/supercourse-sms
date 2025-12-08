import { AssignedBaseActivitySchema, CustomActivitySchema } from './customActivity-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const customActivityDurationSchema = z.object({
  duration: z.number(),
});

const customActivityResponseSchema = z.object({
  success: z.boolean(),
  data: CustomActivitySchema,
});

const assignedActivityResponseSchema = z.object({
  success: z.boolean(),
  data: AssignedBaseActivitySchema,
});

const createCustomActivitySchema = CustomActivitySchema;

const createAssignedActivitySchema = AssignedBaseActivitySchema;

const fileSchema = z.object({
  success: z.boolean(),
  data: z.instanceof(FormData),
});

const assignedTaskAnswersResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    answers: z.any().nullable(),
    taskStatus: z.string(),
    attempts: z.number(),
    score: z.number(),
  }),
});

export const updateAssignedTaskAnswersRequestSchema = z.any().openapi({
  description: 'The answers submitted by the student for this task. Structure varies depending on activity type.',
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

const generateFromAIRequestSchema = z.object({
  query: z.string().openapi({ description: 'The prompt for AI image generation' }),
});

const generateFromAIResponseSchema = z.object({
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

const assignedActivityListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    results: z.array(assignedActivityResponseSchema),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
  }),
});

const addStudentsRequestSchema = z.object({
  students: z
    .array(z.string())
    .nonempty()
    .openapi({
      description: 'Array of student IDs (ObjectId) to add to the assigned activity',
      example: ['674ff12318dcbb3f8c1dd901', '674ff12318dcbb3f8c1dd902'],
    }),
});

const removeStudentsRequestSchema = z.object({
  students: z
    .array(z.string())
    .nonempty()
    .openapi({
      description: 'Array of student IDs (ObjectId) to remove from the assigned activity',
      example: ['674ff12318dcbb3f8c1dd901', '674ff12318dcbb3f8c1dd902'],
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
      patch: {
        tags: ['Custom-activities'],
        summary: 'Update a custom activity plays',
        description: 'Update a custom activity plays with the given details',
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
          //required: true,
          content: {
            'application/json': {
              schema: customActivityDurationSchema,
            },
          },
        },
        responses: {
          '200': {
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
    '/custom-activities/user/{userId}/tag/{tag}': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get custom activities by user id and cefr',
        description: 'Retrieve a list of all single player custom activities by user id and cefr',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
          {
            name: 'tag',
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
        description: 'Duplicate a custom activity by the activity id and branch id',
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
                schema: assignedActivityListResponseSchema,
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
    '/custom-activities/student-activity/user/{userId}/activity/{activityId}': {
      get: {
        tags: ['Custom-activities'],
        summary: "Get student's custom activitiy by userId and activityId",
        description: 'Retrieve a students custom activity',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
          {
            name: 'activityId',
            in: 'path',
            schema: { type: 'string' },
            description: 'Search term for activity',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Student custom activity retrieved successfully',
            content: {
              'application/json': {
                schema: assignedActivityResponseSchema,
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
    '/custom-activities/assigned-activities': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get assigned custom activitiies',
        description: 'Retrieve all the assigned activities',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [],
        responses: {
          '200': {
            description: 'Assigned activities retrieved successfully',
            content: {
              'application/json': {
                schema: assignedActivityListResponseSchema,
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
    '/custom-activities/assigned-activities/create/activity/{activityId}': {
      post: {
        tags: ['Custom-activities'],
        summary: 'Create an assigned activity from a custom activity',
        description:
          'Duplicates a custom activity into an assigned custom activity by pass a list of students to assign at creation.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID of the custom activity to duplicate',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                students: z.array(z.string()).openapi({
                  description: 'Array of student IDs (ObjectId) to assign during creation',
                  example: ['674ff12318dcbb3f8c1dd901', '674ff12318dcbb3f8c1dd902'],
                }),
                classId: z.string().openapi({
                  description: 'Class id to assign during creation',
                  example: '674ff12318dcbb3f8c1dd901',
                }),
                assignmentBundle: z.string().openapi({
                  description: 'assignmentBundle to assign during creation',
                  example: 'Bundle 1',
                }),
              }),
            },
          },
        },
        responses: {
          '201': {
            description: 'Assigned activity created successfully',
            content: {
              'application/json': {
                schema: assignedActivityResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid activity ID or request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Custom activity not found',
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
    '/custom-activities/assigned-activities/update-status/{activityId}/{studentId}': {
      patch: {
        tags: ['Custom-activities'],
        summary: "Update a student's activity status",
        description: 'Update the `completed` status of a specific student in an assigned custom activity.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID of the custom activity to duplicate',
          } as ParameterObject,
          {
            name: 'studentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID of the student whose status is being updated',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                status: z.boolean().openapi({
                  description: 'The completed status to set for the student',
                  example: true,
                }),
              }),
            },
          },
        },
        responses: {
          '201': {
            description: 'Status updated successfully',
            content: {
              'application/json': {
                schema: assignedActivityResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid activity or student ID',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Activity or student not found',
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
    '/custom-activities/assigned-activities-add-students/activity/{activityId}': {
      patch: {
        tags: ['Custom-activities'],
        summary: 'Update an assigned activity',
        description: 'Update an assigned activity by adding students',
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
              schema: addStudentsRequestSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Custom activity updated successfully',
            content: {
              'application/json': {
                schema: assignedActivityResponseSchema,
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
    '/custom-activities/assigned-activities-remove-students/activity/{activityId}': {
      patch: {
        tags: ['Custom-activities'],
        summary: 'Remove students from an assigned activity',
        description: 'Removes one or more students from an existing assigned custom activity.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID of the assigned activity to update',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: removeStudentsRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Students removed successfully from the assigned activity',
            content: {
              'application/json': {
                schema: assignedActivityResponseSchema,
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
    '/custom-activities/task-answers/{assignmentId}/{studentId}/{customActivityId}': {
      get: {
        tags: ['Custom-activities'],
        summary: 'Get assigned task answers',
        description: 'Retrieve the answers for a specific task (custom activity) assigned to a student.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'assignmentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'AssignmentForStudent ID',
          } as ParameterObject,
          {
            name: 'studentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student user ID',
          } as ParameterObject,
          {
            name: 'customActivityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Custom activity ID inside assignment.tasks[]',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assigned task answers retrieved successfully',
            content: {
              'application/json': {
                schema: assignedTaskAnswersResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad request',
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
            description: 'Assignment or task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Custom-activities'],
        summary: 'Update assigned task answers',
        description: 'Submit or update the answers for a specific assigned custom activity task.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'assignmentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'AssignmentForStudent ID',
          } as ParameterObject,
          {
            name: 'studentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student user ID',
          } as ParameterObject,
          {
            name: 'customActivityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Custom activity ID inside assignment.tasks[]',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: updateAssignedTaskAnswersRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Assigned task answers updated successfully',
            content: {
              'application/json': {
                schema: assignedTaskAnswersResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad request',
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
            description: 'Assignment or task not found',
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
