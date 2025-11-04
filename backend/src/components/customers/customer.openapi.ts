import {
  customerCreateSchema,
  customerUpdateSchema,
  addUserToCustomerSchema,
  CustomerSchema,
} from './customer-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const customerResponseSchema = z.object({
  success: z.boolean(),
  data: CustomerSchema,
});

const customersListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  data: z.array(CustomerSchema),
});

export const customerOpenApi = {
  tags: [
    {
      name: 'Customers',
      description: 'Customer management operations',
    },
  ],
  paths: {
    '/customers/main': {
      get: {
        tags: ['Customers'],
        summary: 'Get main customer',
        description: 'Retrieve the main customer details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Main customer details retrieved successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
            description: 'Main customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Customers'],
        summary: 'Update main customer',
        description: 'Update details of the main customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: customerUpdateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Main customer updated successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
            description: 'Main customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers'],
        summary: 'Get all customers',
        description: 'Retrieve a list of all customers',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'List of customers retrieved successfully',
            content: {
              'application/json': {
                schema: customersListResponseSchema,
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
        tags: ['Customers'],
        summary: 'Create a new customer',
        description: 'Create a new customer with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: customerCreateSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Customer created successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
    '/customers/{id}': {
      get: {
        tags: ['Customers'],
        summary: 'Get customer by ID',
        description: 'Retrieve details of a specific customer by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Customer details retrieved successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Customers'],
        summary: 'Update customer',
        description: 'Update details of a specific customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: customerUpdateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Customer updated successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Customers'],
        summary: 'Delete customer',
        description: 'Delete a specific customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Customer deleted successfully',
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
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/customers/slug/{slug}': {
      get: {
        tags: ['Customers'],
        summary: 'Get customer by slug',
        description: 'Retrieve a customer by its slug',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer slug',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Customer details retrieved successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/customers/type/{type}': {
      get: {
        tags: ['Customers'],
        summary: 'Get customers by type',
        description: 'Retrieve customers by type',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'type',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: [
                'PRIVATE_SCHOOL',
                'PRIVATE_TUTORING',
                'PUBLIC_SCHOOL',
                'PRIVATE_PROFESSOR',
                'SELF_TAUGHT_PROFESSOR',
                'SUB_STORE',
              ],
            },
            description: 'Customer type',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of customers retrieved successfully',
            content: {
              'application/json': {
                schema: customersListResponseSchema,
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
    '/customers/{id}/users': {
      post: {
        tags: ['Customers'],
        summary: 'Add user to customer',
        description: 'Add a user to a specific customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: addUserToCustomerSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User added to customer successfully',
            content: {
              'application/json': {
                schema: customerResponseSchema,
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
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Customers'],
        summary: 'Remove user from customer',
        description: 'Remove a user from a specific customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: addUserToCustomerSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User removed from customer successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Customer or user not found',
          },
        },
      },
    },
  },
};
