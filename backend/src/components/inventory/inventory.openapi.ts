import {
  createInventorySchema,
  updateInventorySchema,
  InventorySchema,
  InventoryUserSchema,
  InventoryCustomerSchema,
} from './inventory-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const inventoryResponseSchema = z.object({
  success: z.boolean(),
  data: InventorySchema,
});

const inventoryListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  data: z.array(InventorySchema),
});

export const inventoryOpenApi = {
  tags: [
    {
      name: 'Inventory',
      description: 'Inventory management operations',
    },
  ],
  components: {
    schemas: {
      InventoryUser: InventoryUserSchema,
      InventoryCustomer: InventoryCustomerSchema,
      Inventory: InventorySchema,
      CreateInventory: createInventorySchema,
      UpdateInventory: updateInventorySchema,
    },
  },
  paths: {
    '/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'Get all inventory items',
        description: 'Retrieve a list of all inventory items with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'user',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by user ID',
          } as ParameterObject,
          {
            name: 'customer',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by customer ID',
          } as ParameterObject,
          {
            name: 'item_type',
            in: 'query',
            schema: { type: 'string', enum: ['ASSET', 'ELIBRARY'] },
            description: 'Filter by type of inventory item',
          } as ParameterObject,
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search term for inventory title',
          } as ParameterObject,
          {
            name: 'from_date',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by billing date (from)',
          } as ParameterObject,
          {
            name: 'to_date',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by billing date (to)',
          } as ParameterObject,
          {
            name: 'returned',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by returned status',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of inventory items retrieved successfully',
            content: {
              'application/json': {
                schema: inventoryListResponseSchema,
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
        tags: ['Inventory'],
        summary: 'Create a new inventory item',
        description: 'Create a new inventory item with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createInventorySchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Inventory item created successfully',
            content: {
              'application/json': {
                schema: inventoryResponseSchema,
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
    '/inventory/{id}': {
      get: {
        tags: ['Inventory'],
        summary: 'Get inventory item by ID',
        description: 'Retrieve details of a specific inventory item by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inventory item ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Inventory item details retrieved successfully',
            content: {
              'application/json': {
                schema: inventoryResponseSchema,
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
            description: 'Inventory item not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Inventory'],
        summary: 'Update inventory item',
        description: 'Update details of a specific inventory item',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inventory item ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateInventorySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Inventory item updated successfully',
            content: {
              'application/json': {
                schema: inventoryResponseSchema,
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
            description: 'Inventory item not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Inventory'],
        summary: 'Delete inventory item',
        description: 'Delete a specific inventory item',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inventory item ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Inventory item deleted successfully',
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
            description: 'Inventory item not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/inventory/{id}/mark-returned': {
      patch: {
        tags: ['Inventory'],
        summary: 'Mark inventory item as returned',
        description: 'Mark a specific inventory item as returned',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inventory item ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Inventory item marked as returned successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Inventory item not found',
          },
        },
      },
    },
  },
};
