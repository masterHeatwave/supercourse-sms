import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';
import { itemSchema, updateBookmarksRequestBodySchema } from './bookmark-validate.schema';

export const bookmarkOpenApi = {
  tags: [{ name: 'Ebook Bookmarks', description: 'Ebook Bookmark management operations' }],
  paths: {
    '/bookmarks/{appId}': {
      get: {
        tags: ['Ebook Bookmarks'],
        summary: 'Get all bookmarks',
        description: 'Retrieve a list of all bookmarks',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'appId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Filter bookmarks by appId',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of bookmarks retrieved successfully',
            content: {
              'application/json': {
                schema: z.array(itemSchema),
              },
            },
          },
          '404': {
            description: 'No bookmarks found for the specified combination of userId and appId',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server or database error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/bookmarks': {
      put: {
        tags: ['Ebook Bookmarks'],
        summary: 'Update bookmarks',
        description: 'Replace the old list of bookmarks with the new one',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: updateBookmarksRequestBodySchema,
            },
          },
        },
        responses: {
          '204': {
            description: 'No content – list of bookmarks updated successfully',
          },
          '404': {
            description: 'Cannot update bookmarks for the specified combination of userId and appId',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server or database error',
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
