import { createSchema, ErrorItemSchema } from './error-validate.schema';
import { z } from 'zod';

const errorResponseSchema = z.object({
  success: z.boolean(),
  data: ErrorItemSchema,
});

export const errorOpenApi = {
  tags: [
    {
      name: 'Errors',
      description: 'Error logging operations',
    },
  ],
  paths: {
    '/error': {
      post: {
        tags: ['Errors'],
        summary: 'Create a new error log',
        description: 'Log an error that occurred in the system',
        security: [{ AuthHeader: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Error logged successfully',
            content: {
              'application/json': {
                schema: errorResponseSchema,
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
