import 'zod-openapi/extend';
import { z } from 'zod';
import { IUserType } from './user.interface';
import { CustomerType } from '@components/customers/customer.interface';

// Utility schema: accept either comma-separated string or array of strings and normalize to string[]
const StringOrArrayToStringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) return [] as string[];
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    if (Array.isArray(value)) {
      return value
        .map((s) => (typeof s === 'string' ? s.trim() : s))
        .filter((s) => typeof s === 'string' && s.length > 0) as string[];
    }
    return undefined as unknown as string[];
  });

// Role schema
export const RoleSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    permissions: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    id: z.string(),
  })
  .openapi({
    title: 'Role',
    description: 'Role model',
  });

// Branch schema
export const BranchSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    customer_type: z.string(),
    is_primary: z.boolean(),
    is_main_customer: z.boolean(),
    email: z.string(),
    users: z.array(z.string()),
    administrator: z.string().optional(),
    manager: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    vat: z.string().optional(),
    mapLocation: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    id: z.string(),
  })
  .openapi({
    title: 'Branch',
    description: 'Branch model',
  });

// Contact schema
export const ContactSchema = z
  .object({
    name: z.string().min(1, { message: 'Contact name is required' }),
    phone: z.string().min(1, { message: 'Contact phone is required' }),
    email: z.string().email({ message: 'Please add a valid contact email' }),
    relationship: z.string().min(1, { message: 'Relationship is required' }),
    isPrimaryContact: z.boolean().default(false),
  })
  .openapi({
    title: 'Contact',
    description: 'Contact model',
  });

// Register base schemas
export const UserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    code: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    phone: z.string().min(1, { message: 'Phone is required' }),
    mobile: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
    zipcode: z.string().optional(),
    birthday: z.string().optional(),
    is_active: z.boolean(),
    customers: z.array(z.string()).optional(),
    roles: z.array(RoleSchema).optional(),
    taxis: z.array(z.string()).optional(),
    user_type: z.nativeEnum(IUserType),
    avatar: z.string().optional(),
    branches: z.array(BranchSchema).optional(),
    default_branch: z.string().optional(),
    role_title: z.string().optional(),
    status: z.boolean().optional(),
    hire_date: z.string().optional(),
    registration_date: z.string().optional(),
    facebook_link: z.string().optional(),
    twitter_link: z.string().optional(),
    linkedin_link: z.string().optional(),
    documents: z.array(z.string()).optional(),
    notes: z.string().optional(),
    // Student-specific fields
    contacts: z.array(ContactSchema).optional(),
    siblingAttending: z.array(z.string()).optional(),
    hasAllergies: z.boolean().optional(),
    healthDetails: z.string().optional(),
    generalNotes: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    // Runtime-computed fields (not stored in DB)
    on_live_session: z.boolean().optional(),
    // Virtual fields
    class: z.string().optional(),
  })
  .openapi({
    title: 'User',
    description: 'User model',
  });

// Paginated response schema
export const PaginatedResponseSchema = z
  .object({
    data: z.object({
      results: z.array(UserSchema),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
      totalResults: z.number(),
    }),
    success: z.boolean(),
    status: z.number(),
  })
  .openapi({
    title: 'PaginatedResponse',
    description: 'Paginated response model',
  });

// Success response schema
export const SuccessResponseSchema = z
  .object({
    data: UserSchema,
    success: z.boolean(),
    status: z.number(),
  })
  .openapi({
    title: 'SuccessResponse',
    description: 'Success response model',
  });

// Error response schema
export const ErrorResponseSchema = z
  .object({
    message: z.string(),
    success: z.boolean(),
    status: z.number(),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'Error response model',
  });

// Query parameters schema
export const queryAllSchema = z.object({
  is_active: z.string().optional(),
  archived: z.string().optional(),
  branch: z.string().optional(),
  role: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  select: z.string().optional(),
  populate: z.string().optional(),
  query: z.string().optional(),
  user_type: z.nativeEnum(IUserType).optional(),
});

// Create user schema
const createSchema = UserSchema.extend({
  username: UserSchema.shape.username.refine((val) => val && val.length >= 3, {
    message: 'Username must be at least 3 characters',
  }),
  user_type: z.nativeEnum(IUserType).optional().default(IUserType.STUDENT),
  customers: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  branches: z.array(z.string()).optional(),
  // Student-specific fields
  contacts: z.array(ContactSchema).optional(),
  siblingAttending: StringOrArrayToStringArray,
  hasAllergies: z.boolean().optional(),
  healthDetails: z.string().optional(),
  generalNotes: z.string().optional(),
}).openapi({
  title: 'CreateUser',
  description: 'Schema for creating a new user',
});

const updateSchema = z.object({
  id: z.string(),
  username: z.string().min(3).optional(),
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1, { message: 'Phone is required' }).optional(),
  mobile: z.string().optional(),
  password: z.string().min(6).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  birthday: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  is_active: z.boolean().optional(),
  customers: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  branches: z.array(z.string()).optional(),
  user_type: z.nativeEnum(IUserType).optional(),
  // Student-specific fields
  contacts: z.array(ContactSchema).optional(),
  siblingAttending: StringOrArrayToStringArray,
  hasAllergies: z.boolean().optional(),
  healthDetails: z.string().optional(),
  generalNotes: z.string().optional(),
  // Additional fields
  default_branch: z.string().optional(),
  avatar: z.string().optional(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Create STAFF schema (for staff management, but uses valid user types)
export const createStaffSchema = z
  .object({
    username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
    firstname: z.string().min(1, { message: 'First name is required' }),
    lastname: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email({ message: 'Please add a valid email' }),
    phone: z.string().min(1, { message: 'Phone is required' }),

    user_type: z.nativeEnum(IUserType).default(IUserType.TEACHER), // Default to teacher for staff

    mobile: z.string().optional(),
    city: z.string().optional(),
    zipcode: z.string().optional(),
    roles: z.array(z.string()).optional(),
    branches: z.array(z.string()).optional(),
    position: z.string().optional(),
    archived: z.boolean().optional(),

    region: z.string().optional(),
    startDate: z.string().datetime({ message: 'Invalid ISO date format for startDate' }).optional(),
    registration_date: z.string().datetime({ message: 'Invalid ISO date format for registration_date' }).optional(),

    country: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    tax_id: z.number().optional(),
    internal_number: z.string().optional(),

    facebook_link: z.string().url().optional().or(z.literal('')),
    twitter_link: z.string().url().optional().or(z.literal('')),
    linkedin_link: z.string().url().optional().or(z.literal('')),

    avatar: z.string().optional(),
    documents: z.array(z.string()).optional(),

    password: z.string().min(6).optional(),

    customer: z.string({ required_error: 'Customer ID is required' }),
  })
  .openapi({
    title: 'CreateStaffMember',
    description: 'Schema for creating a new staff member (uses valid user types).',
  });

export const updateStaffSchema = z.object({
  id: z.string(),
  username: z.string().min(3).optional(),
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  mobile: z.string().optional(),
  password: z.string().min(6).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  birthday: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  is_active: z.boolean().optional(),
  branches: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  role_title: z.string().optional(),
  status: z.boolean().optional(),
  hire_date: z
    .preprocess((arg) => {
      if (typeof arg == 'string' || arg instanceof Date) return new Date(arg);
    }, z.date())
    .optional(),
  registration_date: z
    .preprocess((arg) => {
      if (typeof arg == 'string' || arg instanceof Date) return new Date(arg);
    }, z.date())
    .optional(),
  facebook_link: z.string().url().optional().or(z.literal('')),
  twitter_link: z.string().url().optional().or(z.literal('')),
  linkedin_link: z.string().url().optional().or(z.literal('')),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
  avatar: z.string().optional(),
});

export const archiveSchema = z.object({
  id: z.string(),
  archived: z.boolean(),
});

export const makePrimaryContactSchema = z.object({
  user_id: z.string(),
  customer_id: z.string(),
});

const internalCustomerPayloadSchema = z
  .object({
    name: z.string().min(1, 'Customer name is required'),
    slug: z.string().min(1, 'Customer slug is required'),
    customer_type: z.nativeEnum(CustomerType),
    nickname: z.string().optional(),
    afm: z.string().optional(),
    scap_id: z.string().optional(),
    is_main_customer: z.boolean().optional(),
    is_primary: z.boolean().optional(),
    email: z.string().email('Invalid email format').optional(),
    customer_email: z.string().email('Invalid customer email format').optional(),
    manager_name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipcode: z.string().optional(),
    country: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    note: z.string().optional(),
    vat: z.string().optional(),
    erp_code: z.string().optional(),
  })
  .passthrough();

export const internalCreateSchoolSchema = z
  .object({
    main_customer: internalCustomerPayloadSchema,
    branch_customer: internalCustomerPayloadSchema.optional(),
    user: z.object({
      username: z.string().min(3, 'Username must be at least 3 characters'),
      firstname: z.string().min(1, 'First name is required'),
      lastname: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email format for user'),
      phone: z.string().min(10, 'Phone number must be at least 10 digits'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
  })
  .openapi({
    title: 'InternalCreateSchool',
    description: 'Schema for internally creating a school (main customer, branch, user)',
  });

export const internalCreateBranchSchema = z
  .object({
    branch_customer: internalCustomerPayloadSchema,
    supercourse_sub_customer_id: z.string().min(1, 'Supercourse sub-customer ID is required'),
    parent_supercourse_customer_id: z.string().min(1, 'Parent supercourse customer ID is required'),
  })
  .openapi({
    title: 'InternalCreateBranch',
    description: 'Schema for internally creating a branch from supercourse sub-customer',
  });

export const internalSetPrimaryBranchSchema = z
  .object({
    supercourse_sub_customer_id: z.string().min(1, 'Supercourse sub-customer ID is required'),
    parent_supercourse_customer_id: z.string().min(1, 'Parent supercourse customer ID is required'),
  })
  .openapi({
    title: 'InternalSetPrimaryBranch',
    description: 'Schema for setting a branch as primary in both main and tenant databases',
  });

export { createSchema, updateSchema };
