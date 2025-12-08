import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';
import { NoteResponseSchema, NoteDataSchema, NoteRequestUpdateSchema } from './note-validate.schema';

export const noteOpenApi = {
  tags: [{ name: 'Ebook', description: 'Ebook management operations' }],
  paths: {
    '/notes/{appId}': {
      get: {
        tags: ['Ebook'],
        summary: 'Get all notes',
        description: 'Retrieve a list of all notes for a specific app',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'appId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Filter notes by appId',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of notes retrieved successfully',
            content: {
              'application/json': {
                schema: z.array(NoteResponseSchema),
              },
            },
          },
          '404': {
            description: 'No notes found for the specified combination of userId and appId',
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
      post: {
        tags: ['Ebook'],
        summary: 'Create Note',
        description: 'Create a new ebook note',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'appId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Create a note for the specified appId',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: NoteDataSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'New note has been created successfully. Returns the created document',
            content: {
              'application/json': {
                schema: NoteResponseSchema,
              },
            },
          },
          '404': {
            description: 'Cannot create new note for the specified combination of userId and appId',
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
    '/notes/{noteId}': {
      put: {
        tags: ['Ebook'],
        summary: 'Update Note',
        description: 'Update an ebook note',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'noteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Update note by noteId',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: NoteRequestUpdateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Note has been updated successfully. Returns the updated document',
            content: {
              'application/json': {
                schema: NoteResponseSchema,
              },
            },
          },
          '404': {
            description: 'No note found for the specified noteId',
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
      delete: {
        tags: ['Ebook'],
        summary: 'Delete Note',
        description: 'Delete an ebook note',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'noteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Delete note by noteId',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'No content – note deleted successfully',
          },
          '404': {
            description: 'Cannot delete note for the specified noteId',
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
