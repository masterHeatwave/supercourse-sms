import { createPostSchema, updatePostSchema, addTagSchema, removeTagSchema, PostSchema } from './post-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const postResponseSchema = z.object({
  success: z.boolean(),
  data: PostSchema,
});

const postsListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  data: z.array(PostSchema),
});

export const postOpenApi = {
  tags: [
    {
      name: 'Posts',
      description: 'Post management operations',
    },
  ],
  paths: {
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Get all posts',
        description: 'Retrieve a list of all posts with optional filtering',
        parameters: [
          {
            name: 'author',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by author ID',
          } as ParameterObject,
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
            },
            description: 'Filter by post status',
          } as ParameterObject,
          {
            name: 'tag',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by tag',
          } as ParameterObject,
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search term for post title or content',
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
            name: 'featured',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by featured status',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of posts retrieved successfully',
            content: {
              'application/json': {
                schema: postsListResponseSchema,
              },
            },
          },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a new post',
        description: 'Create a new post with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createPostSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Post created successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
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
    '/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get post by ID',
        description: 'Retrieve details of a specific post by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Post details retrieved successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
              },
            },
          },
          '404': {
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Posts'],
        summary: 'Update post',
        description: 'Update details of a specific post',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updatePostSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Post updated successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
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
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete post',
        description: 'Delete a specific post',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Post deleted successfully',
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
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/add-tag': {
      post: {
        tags: ['Posts'],
        summary: 'Add tag to post',
        description: 'Add a tag to a specific post',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: addTagSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Tag added successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
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
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/remove-tag': {
      post: {
        tags: ['Posts'],
        summary: 'Remove tag from post',
        description: 'Remove a tag from a specific post',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: removeTagSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Tag removed successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
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
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/publish': {
      patch: {
        tags: ['Posts'],
        summary: 'Publish post',
        description: 'Publish a specific post',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Post published successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
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
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/archive': {
      patch: {
        tags: ['Posts'],
        summary: 'Archive post',
        description: 'Archive a specific post',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Post archived successfully',
            content: {
              'application/json': {
                schema: postResponseSchema,
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
            description: 'Post not found',
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
