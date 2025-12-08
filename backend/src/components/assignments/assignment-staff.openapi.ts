import {
  createAssignmentForStaffSchema,
  updateAssignmentForStaffSchema,
  AssignmentForStaffSchema,
  getAssignmentByIDQuerySchema,
  updateAssignmentQuerySchema,
  draftAssignmentQuerySchema,
  undraftAssignmentQuerySchema,
  deleteAssignmentForMeQuerySchema,
  restoreAssignmentForMeQuerySchema,
  deleteAssignmentForEveryoneQuerySchema,
  restoreAssignmentForEveryoneQuerySchema,
} from './assignment-staff-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const assignmentForStaffResponseSchema = z.object({
  success: z.boolean(),
  data: AssignmentForStaffSchema,
});

const assignmentsForStaffListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  data: z.array(AssignmentForStaffSchema),
});

const messageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const assignmentStaffOpenApi = {
  tags: [
    {
      name: 'Assignments (for Staff)',
      description: 'APIs for managing assignments created by staff members (admin, manager, teacher).',
    },
  ],

  paths: {
    '/assignments/staff': {
      get: {
        tags: ['Assignments (for Staff)'],
        summary: 'Get all assignments',
        description: 'Retrieve a list of all assignments created by staff members with optional filtering.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'branchID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by branch ID',
            required: true,
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Filter by staff role',
            required: true,
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by staff member ID (🙋🏻‍♂️ required if "staffRole" is "teacher")',
          } as ParameterObject,
          {
            name: 'classID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by class ID',
          } as ParameterObject,
          // {
          //   name: 'studentID',
          //   in: 'query',
          //   schema: { type: 'string' },
          //   description: 'Filter by student ID',
          // } as ParameterObject,
          {
            name: 'academicYearID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic year ID',
            required: true,
          } as ParameterObject,
          {
            name: 'academicPeriodID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic period ID',
          } as ParameterObject,
          {
            name: 'academicSubperiodID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic subperiod ID',
          } as ParameterObject,
          {
            name: 'isDrafted',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filter by draft status (true/false)',
          } as ParameterObject,
          {
            name: 'isDeletedForMe',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filter by deleted for me status (true/false)',
          } as ParameterObject,
          {
            name: 'isDeletedForEveryone',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filter by deleted for everyone status (true/false)',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of assignments retrieved successfully',
            content: {
              'application/json': {
                schema: assignmentsForStaffListResponseSchema,
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
        tags: ['Assignments (for Staff)'],
        summary: 'Create a new assignment',
        description: 'Create a new assignment by staff member (admin, manager, teacher).',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createAssignmentForStaffSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Assignment created successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid input - validation error',
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

    '/assignments/staff/{id}': {
      get: {
        tags: ['Assignments (for Staff)'],
        summary: 'Get assignment by ID',
        description:
          'Retrieve details of a specific assignment by its ID. Requires authorization parameters to ensure proper access control.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment details retrieved successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required authorization parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to access this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Assignments (for Staff)'],
        summary: 'Update assignment by ID',
        description: 'Update details of a specific assignment by its ID. Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateAssignmentForStaffSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Assignment updated successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required authorization parameters or validation error',
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
          '403': {
            description: 'Forbidden - User does not have permission to update this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to update assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/staff/draft/{id}': {
      patch: {
        tags: ['Assignments (for Staff)'],
        summary: 'Draft assignment',
        description: 'Mark an assignment as drafted. Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment drafted successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to draft this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to draft assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/staff/undraft/{id}': {
      patch: {
        tags: ['Assignments (for Staff)'],
        summary: 'Undraft assignment',
        description: 'Mark an assignment as undrafted (publish it). Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment undrafted successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to undraft this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to undraft assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/staff/delete-for-me/{id}': {
      patch: {
        tags: ['Assignments (for Staff)'],
        summary: 'Delete assignment temporarily for me',
        description:
          'Mark assignment as deleted for the current user (soft delete for me). Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment temporarily deleted for me successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to delete this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to delete assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Assignments (for Staff)'],
        summary: 'Delete assignment permanently for me',
        description: 'Permanently delete assignment for the current user. Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment permanently deleted for me successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to delete this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to permanently delete assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/staff/restore-for-me/{id}': {
      patch: {
        tags: ['Assignments (for Staff)'],
        summary: 'Restore assignment for me',
        description: 'Restore a previously deleted assignment for the current user. Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment restored successfully for me',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to restore this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to restore assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/staff/delete-for-everyone/{id}': {
      patch: {
        tags: ['Assignments (for Staff)'],
        summary: 'Delete assignment temporarily for everyone',
        description:
          'Mark assignment as deleted for all users (soft delete for everyone). Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment temporarily deleted for everyone successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to delete this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to delete assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Assignments (for Staff)'],
        summary: 'Delete assignment permanently for everyone',
        description:
          'Permanently delete assignment for all users. This also deletes all related student assignments. Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment permanently deleted for everyone successfully',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to delete this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to permanently delete assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/staff/restore-for-everyone/{id}': {
      patch: {
        tags: ['Assignments (for Staff)'],
        summary: 'Restore assignment for everyone',
        description:
          'Restore a previously deleted assignment for all users. This also restores all related student assignments. Requires authorization parameters.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Staff member ID for authorization',
          } as ParameterObject,
          {
            name: 'staffRole',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['admin', 'manager', 'teacher'],
            },
            description: 'Staff role for authorization (admin, manager, or teacher)',
          } as ParameterObject,
          {
            name: 'branchID',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Branch ID for authorization',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment restored successfully for everyone',
            content: {
              'application/json': {
                schema: assignmentForStaffResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad Request - Missing required parameters',
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
          '403': {
            description: 'Forbidden - User does not have permission to restore this assignment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error - Failed to restore assignment',
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
