import { patch } from 'axios';
import { ParameterObject } from 'openapi3-ts/oas31';
import z from 'zod';

export const chatbotOpenApi = {
  tags: [
    {
      name: 'Chatbot',
      description: 'Chatbot management operations',
    },
  ],
  paths: {
    '/chatbot': {
      post: {
        tags: ['Chatbot'],
        summary: 'Create a new message',
        description: 'Create a new message to the chatbot',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        responses: {
          '201': {
            description: 'Chatbot message created successfully',
            content: {
              'application/json': {
                schema: z.string(),
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
