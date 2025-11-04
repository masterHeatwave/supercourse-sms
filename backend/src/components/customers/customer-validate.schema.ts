import 'zod-openapi/extend';
import { z } from 'zod';
import { CustomerType } from './customer.interface';

export const CustomerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    nickname: z.string().optional(),
    afm: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    avatar: z.string().optional(),
    website: z.string().optional(),
    customer_type: z.nativeEnum(CustomerType),
    erp_code: z.string().optional(),
    scrap_id: z.string().optional(),
    is_primary: z.boolean().optional(),
    is_main_customer: z.boolean().optional(),
    email: z.string().email().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    administrator: z.string().optional(),
    manager: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    vat: z.string().optional(),
    mapLocation: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Customer',
    description: 'Customer model',
  });

export const customerCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    nickname: z.string().optional(),
    afm: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    avatar: z.string().optional(),
    website: z.string().optional(),
    customer_type: z.nativeEnum(CustomerType),
    erp_code: z.string().optional(),
    scrap_id: z.string().optional(),
    is_primary: z.boolean().optional().default(false),
    is_main_customer: z.boolean().optional().default(false),
    email: z.string().email().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    administrator: z.string().optional(),
    manager: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    vat: z.string().optional(),
    mapLocation: z.string().optional(),
  })
  .openapi({
    title: 'CreateCustomer',
    description: 'Schema for creating a new customer',
  });

export const customerUpdateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    slug: z.string().min(1, 'Slug is required').optional(),
    nickname: z.string().optional(),
    afm: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    avatar: z.string().optional(),
    website: z.string().optional(),
    customer_type: z.nativeEnum(CustomerType).optional(),
    erp_code: z.string().optional(),
    scrap_id: z.string().optional(),
    is_primary: z.boolean().optional(),
    is_main_customer: z.boolean().optional(),
    email: z.string().email().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    administrator: z.string().optional(),
    manager: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    vat: z.string().optional(),
    mapLocation: z.string().optional(),
  })
  .openapi({
    title: 'UpdateCustomer',
    description: 'Schema for updating an existing customer',
  });

export const addUserToCustomerSchema = z
  .object({
    userId: z.string().min(1, 'User ID is required'),
  })
  .openapi({
    title: 'AddUserToCustomer',
    description: 'Schema for adding a user to a customer',
  });

export const customerIdParamSchema = z
  .object({
    id: z.string().min(1, 'Customer ID is required'),
  })
  .openapi({
    title: 'CustomerIdParam',
    description: 'Customer ID parameter',
  });

export const customerSlugParamSchema = z
  .object({
    slug: z.string().min(1, 'Customer slug is required'),
  })
  .openapi({
    title: 'CustomerSlugParam',
    description: 'Customer slug parameter',
  });

export const customerTypeParamSchema = z
  .object({
    type: z.nativeEnum(CustomerType),
  })
  .openapi({
    title: 'CustomerTypeParam',
    description: 'Customer type parameter',
  });
