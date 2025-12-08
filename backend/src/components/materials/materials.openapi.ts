import { z } from 'zod';
import { ParameterObject } from 'openapi3-ts/oas31';

// Create Zod schema for Material
export const MaterialSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number().optional(),
    category: z.string().optional(),
    component_type: z.string().optional(),
    icon_url: z.string().nullable().optional(),
    components: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          component_type: z.string().optional(),
          category: z.string().optional(),
          description: z.string().optional(),
          json_data: z.any().optional(),
          avatar: z
            .object({
              id: z.string(),
              file_name: z.string().optional(),
              file_type: z.string().optional(),
              file_path: z.string().optional(),
            })
            .optional(),
          assets: z
            .array(
              z.object({
                id: z.string(),
                edition: z.string().optional(),
                source: z.string().optional(),
                asset_type: z.string().optional(),
                target: z.string().optional(),
              })
            )
            .optional(),
        })
      )
      .optional(),
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
    '/materials/taxis/{taxiId}': {
      get: {
        tags: ['Materials'],
        summary: 'Get materials for a specific taxi/class',
        description: 'Retrieves products assigned to a specific taxi/class from supercourse-api',
        security: [
          {
            AuthHeader: [],
            CustomerSlug: [],
          },
        ],
        parameters: [
          {
            name: 'taxiId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'The ID of the taxi/class',
          } as ParameterObject,
        ],
        responses: {
          200: {
            description: 'Taxi materials retrieved successfully',
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
