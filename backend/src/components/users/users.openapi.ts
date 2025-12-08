import {
  createSchema,
  createStaffSchema,
  updateSchema,
  updateStaffSchema,
  archiveSchema,
  makePrimaryContactSchema,
  UserSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  internalCreateSchoolSchema,
} from './users-validate.schemas';
import { ParameterObject } from 'openapi3-ts/oas31';
import { CustomerSchema } from '@components/customers/customer-validate.schema';
import { z } from 'zod';

const InternalCreateSchoolResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    mainCustomer: CustomerSchema,
    branchCustomer: CustomerSchema,
    user: UserSchema,
  }),
});

export const usersOpenApi = {
  tags: [
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Internal',
      description: 'Internal system operations (requires API Key)',
    },
  ],
  paths: {
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve a list of all users with optional filtering and pagination',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'is_active',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by active status',
          } as ParameterObject,
          {
            name: 'archived',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by archived status (true/false)',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch ID. If not provided, returns all users',
          } as ParameterObject,
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by role title (e.g., MANAGER, TEACHER, STUDENT). If not provided, returns all users',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of items per page',
          } as ParameterObject,
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
            description: 'Sort field and direction (e.g., "createdAt:desc")',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of users retrieved successfully',
            content: {
              'application/json': {
                schema: PaginatedResponseSchema,
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        description: 'Create a new user with the given details',
        requestBody: {
          content: {
            'application/json': {
              schema: createSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/single/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get a single user',
        description: 'Retrieve details of a specific user by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'User details retrieved successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update a user',
        description: 'Update details of a specific user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/archive': {
      patch: {
        tags: ['Users'],
        summary: 'Archive a user',
        description: 'Archive or unarchive a user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: archiveSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User archived/unarchived successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/make-primary-contact': {
      post: {
        tags: ['Users'],
        summary: 'Make user primary contact',
        description: 'Set a user as the primary contact for a customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: makePrimaryContactSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'User set as primary contact successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/resend-password-email/{id}': {
      post: {
        tags: ['Users'],
        summary: 'Resend password email',
        description: 'Resend password creation email to a user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Password email resent successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/staff': {
      get: {
        tags: ['Users'],
        summary: 'Get all staff members',
        description: 'Retrieve a list of all staff members',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'is_active',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by active status',
          } as ParameterObject,
          {
            name: 'archived',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by archived status',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch ID. If not provided, returns all staff members',
          } as ParameterObject,
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by role title (e.g., MANAGER, TEACHER). If not provided, returns all staff members',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of items per page',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of staff members retrieved successfully',
            content: {
              'application/json': {
                schema: PaginatedResponseSchema,
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new staff member',
        description: 'Create a new staff member with the given details',
        requestBody: {
          content: {
            'application/json': {
              schema: createStaffSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Staff member created successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/staff/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get a single staff member',
        description: 'Retrieve details of a specific staff member by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Staff member details retrieved successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '404': {
            description: 'Staff member not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update a staff member',
        description: 'Update details of a specific staff member',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateStaffSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Staff member updated successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '404': {
            description: 'Staff member not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a staff member',
        description: 'Delete a specific staff member',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Staff member deleted successfully',
          },
          '404': {
            description: 'Staff member not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/students': {
      get: {
        tags: ['Users'],
        summary: 'Get all students',
        description: 'Retrieve a list of all students',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'is_active',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by active status',
          } as ParameterObject,
          {
            name: 'archived',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by archived status',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch ID. If not provided, returns all students',
          } as ParameterObject,
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by role title (e.g., STUDENT). If not provided, returns all students',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of items per page',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of students retrieved successfully',
            content: {
              'application/json': {
                schema: PaginatedResponseSchema,
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new student',
        description: 'Create a new student with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Student created successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/students/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get a single student',
        description: 'Retrieve details of a specific student by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Student details retrieved successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '404': {
            description: 'Student not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update a student',
        description: 'Update details of a specific student',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Student updated successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '404': {
            description: 'Student not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a student',
        description: 'Delete a specific student',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Student deleted successfully',
          },
          '404': {
            description: 'Student not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/children': {
      get: {
        tags: ['Users'],
        summary: 'Get children for authenticated parent',
        description: "Returns students whose contacts include the authenticated user's email",
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of items per page',
          } as ParameterObject,
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
            description: 'Sort field and direction (e.g., "createdAt:desc")',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of children retrieved successfully',
            content: {
              'application/json': {
                schema: PaginatedResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/teachers/me/students': {
      get: {
        tags: ['Users'],
        summary: 'Get all students for authenticated teacher',
        description:
          'Returns all students enrolled in sessions where the authenticated teacher is assigned. Only accessible by teachers.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'is_active',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by active status',
          } as ParameterObject,
          {
            name: 'archived',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by archived status',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch ID. If not provided, returns all students',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of items per page',
          } as ParameterObject,
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
            description: 'Sort field and direction (e.g., "createdAt:desc")',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of students retrieved successfully',
            content: {
              'application/json': {
                schema: PaginatedResponseSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Only teachers can access this endpoint',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/users/teachers/{teacherId}/students': {
      get: {
        tags: ['Users'],
        summary: 'Get all students for a specific teacher',
        description:
          'Returns all students enrolled in sessions where the specified teacher is assigned. Admins and Managers can query any teacher. Teachers can only query their own students.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'teacherId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Teacher ID',
          } as ParameterObject,
          {
            name: 'is_active',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by active status',
          } as ParameterObject,
          {
            name: 'archived',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by archived status',
          } as ParameterObject,
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch ID. If not provided, returns all students',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'string' },
            description: 'Page number for pagination',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Number of items per page',
          } as ParameterObject,
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
            description: 'Sort field and direction (e.g., "createdAt:desc")',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of students retrieved successfully',
            content: {
              'application/json': {
                schema: PaginatedResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Teacher ID is required or user is not a teacher',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Teachers can only access their own students',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '404': {
            description: 'Teacher not found',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/internal/schools': {
      post: {
        tags: ['Internal'],
        summary: 'Create School (Customer, Optional Branch, User)',
        description:
          'Internally creates a main customer, optionally a branch customer linked to it, and an admin user.',
        security: [{ ApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: internalCreateSchoolSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'School and user created successfully (branch created if provided)',
            content: {
              'application/json': {
                schema: InternalCreateSchoolResponseSchema,
              },
            },
          },
          '400': {
            description: 'Validation Error or Duplicate Entry',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized (Invalid or missing API Key)',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '500': {
            description: 'Internal Server Error (e.g., role not found)',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
  },
};
