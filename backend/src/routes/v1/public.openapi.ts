import { z } from 'zod';

const PublicCustomerSchema = z.object({
  name: z.string(),
  slug: z.string(),
  avatar: z.string().optional(),
});

const publicCustomersResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  data: z.array(PublicCustomerSchema),
});

export const publicOpenApi = {
  tags: [
    {
      name: 'Public',
      description: 'Public endpoints that do not require authentication',
    },
  ],
  paths: {
    '/public/customers': {
      get: {
        tags: ['Public'],
        summary: 'Get all main customers (schools)',
        description:
          'Retrieve a list of all main customers/schools. This endpoint is public and does not require authentication.',
        security: [],
        responses: {
          '200': {
            description: 'List of main customers retrieved successfully',
            content: {
              'application/json': {
                schema: publicCustomersResponseSchema,
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
  },
};
