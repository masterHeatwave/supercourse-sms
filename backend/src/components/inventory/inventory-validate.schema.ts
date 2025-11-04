import 'zod-openapi/extend';
import { z } from 'zod';

export const InventoryItemTypeEnum = z.enum(['ASSET', 'ELIBRARY']);

// Enhanced User schema for inventory responses
export const InventoryUserSchema = z
  .object({
    id: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    username: z.string().optional(),
    code: z.string().optional(),
    user_type: z.string(),
    role_title: z.string().optional(),
    status: z.boolean().optional(),
    avatar: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
    zipcode: z.string().optional(),
    birthday: z.string().optional(),
    hire_date: z.string().optional(),
    notes: z.string().optional(),
  })
  .openapi({
    title: 'InventoryUser',
    description: 'User details in inventory response',
  });

// Enhanced Customer schema for inventory responses
export const InventoryCustomerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    nickname: z.string().optional(),
    afm: z.string().optional(),
    email: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    vat: z.string().optional(),
    customer_type: z.string(),
    is_primary: z.boolean().optional(),
    is_main_customer: z.boolean().optional(),
    avatar: z.string().optional(),
    website: z.string().optional(),
  })
  .openapi({
    title: 'InventoryCustomer',
    description: 'Customer details in inventory response',
  });

export const InventorySchema = z
  .object({
    id: z.string(),
    user: InventoryUserSchema.nullable(),
    title: z.string(),
    code: z.string(),
    billing_date: z.string(),
    return_date: z.string().optional(),
    notes: z.string().optional(),
    customer: InventoryCustomerSchema,
    item_type: InventoryItemTypeEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Inventory',
    description: 'Inventory model with detailed user and customer information',
  });

export const createInventorySchema = z
  .object({
    user: z.string().min(1, { message: 'User is required' }).optional(),
    title: z.string().min(1, { message: 'Title is required' }),
    billing_date: z.coerce.date(),
    return_date: z.coerce.date().optional(),
    notes: z.string().optional(),
    customer: z.string().min(1, { message: 'Customer is required' }),
    item_type: InventoryItemTypeEnum,
  })
  .refine(
    (data) => {
      if (data.return_date) {
        return data.billing_date < data.return_date;
      }
      return true;
    },
    {
      message: 'Return date must be after billing date',
      path: ['return_date'],
    }
  )
  .openapi({
    title: 'CreateInventory',
    description: 'Schema for creating a new inventory item',
  });

export const updateInventorySchema = z
  .object({
    id: z.string().min(1, { message: 'ID is required' }),
    user: z.string().min(1, { message: 'User is required' }).optional(),
    title: z.string().min(1, { message: 'Title is required' }).optional(),
    billing_date: z.coerce.date().optional(),
    return_date: z.coerce.date().optional(),
    notes: z.string().optional(),
    customer: z.string().min(1, { message: 'Customer is required' }).optional(),
    item_type: InventoryItemTypeEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.billing_date && data.return_date) {
        return data.billing_date < data.return_date;
      }
      return true;
    },
    {
      message: 'Return date must be after billing date',
      path: ['return_date'],
    }
  )
  .openapi({
    title: 'UpdateInventory',
    description: 'Schema for updating an existing inventory item',
  });

export const queryInventorySchema = z
  .object({
    user: z.string().optional(),
    customer: z.string().optional(),
    search: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    returned: z.string().optional(),
    item_type: InventoryItemTypeEnum.optional(),
  })
  .openapi({
    title: 'QueryInventory',
    description: 'Schema for querying inventory items',
  });
