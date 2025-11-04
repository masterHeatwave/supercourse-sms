import { z } from 'zod';

// Create Zod schema for Material
export const MaterialSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number().optional(),
    category: z.string().optional(),
  })
  .openapi({
    title: 'Material',
    description: 'Material model',
  });

export const materialsOpenApi = {
  tags: [
    {
      name: 'Materials',
      description: 'Materials assigned to current branch',
    },
  ],
  paths: {
    '/materials/assigned': {
      get: {
        tags: ['Materials'],
        summary: 'Get materials assigned to current branch',
        description: 'Retrieves products assigned to the current branch from supercourse-api',
        security: [
          {
            AuthHeader: [],
            CustomerSlug: [],
          },
        ],
        responses: {
          200: {
            description: 'Assigned materials retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Material' },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          503: { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
  },
};

export const materialsOpenApiComponents = {
  schemas: {
    Material: MaterialSchema,
  },
};
