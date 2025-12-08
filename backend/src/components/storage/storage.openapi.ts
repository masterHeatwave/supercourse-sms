import { ParameterObject } from 'openapi3-ts/oas31';
import {
  FileUploadSchema,
  PresignedUrlResponseSchema,
  SizeInfoSchema,
  StorageFileResponseListSchema,
  StorageFileResponseSchema,
} from './storage-file.validate';
import { string } from 'zod';

export const storageOpenApi = {
  tags: [
    {
      name: 'Storage',
      description: 'Storage management operations',
    },
  ],
  paths: {
    '/storage/files/{prefix}': {
      get: {
        tags: ['Storage'],
        summary: 'List files in a specific path',
        description: 'Get list of files owned by user in a specific path',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'prefix',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Parent folder path',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Files retrieved successfully',
            content: {
              'application/json': {
                schema: StorageFileResponseListSchema,
              },
            },
          },
          '204': {
            description: 'No files found',
          },
          '400': {
            description: 'Database error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/storage/getFile/{prefix}': {
      get: {
        tags: ['Storage'],
        summary: 'Get a file in a specific path',
        description: 'Get presigned url for a specific file',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'prefix',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Path to file',
          } as ParameterObject,
          {
            name: 'force',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Force download',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'File presigned url retrieved successfully',
            content: {
              'application/json': {
                schema: PresignedUrlResponseSchema,
              },
            },
          },
          '204': {
            description: 'No presigned url genarated',
          },
          '400': {
            description: 'Database error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/storage/size': {
      get: {
        tags: ['Storage'],
        summary: 'Get used/quota info in a specific path',
        description: 'Get used storage by quota in a specific path',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'prefix',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Parent folder path',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Used/quota info retrieved successfully',
            content: {
              'application/json': {
                schema: SizeInfoSchema,
              },
            },
          },
          '204': {
            description: 'No storage info',
          },
          '400': {
            description: 'Database error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/storage/upload': {
      post: {
        tags: ['Storage'],
        summary: 'Upload file',
        description: 'Upload file',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Owner user ID (MongoDB ObjectId)',
          } as ParameterObject,
          {
            name: 'prefix',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Path/folder to upload',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: FileUploadSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: StorageFileResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid owner ID',
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
            description: 'Owner not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/storage/create-folder': {
      post: {
        tags: ['Storage'],
        summary: 'Create folder',
        description: 'Create folder',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Owner user ID (MongoDB ObjectId)',
          } as ParameterObject,
          {
            name: 'prefix',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Folder name',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Folder created successfully',
            content: {
              'application/json': {
                schema: StorageFileResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid owner ID',
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
            description: 'Owner not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/storage/delete': {
      post: {
        tags: ['Storage'],
        summary: 'Delete object',
        description: 'Delete object',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Owner user ID (MongoDB ObjectId)',
          } as ParameterObject,
          {
            name: 'prefix',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Object path',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Object deleted successfully',
            content: {
              'application/json': {
                schema: StorageFileResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid owner ID',
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
            description: 'Owner not found',
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
