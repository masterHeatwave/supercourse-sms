import {
  createAssignmentForStudentSchema,
  updateAssignmentForStudentSchema,
  AssignmentForStudentSchema,
  //* eBook
  AssignmentEbookResponseSchema,
  ebookFieldsToUpdateSchema,
  //* eBook
} from './assignment-student-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';

const assignmentForStudentResponseSchema = z.object({
  success: z.boolean(),
  data: AssignmentForStudentSchema,
});

const assignmentsForStudentListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  data: z.array(AssignmentForStudentSchema),
});

const messageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const assignmentStudentOpenApi = {
  tags: [
    {
      name: 'Assignments (for Students)',
      description: 'APIs for students to view and complete their assignments.',
    },
  ],

  paths: {
    '/assignments/student': {
      get: {
        tags: ['Assignments (for Students)'],
        summary: 'Get all student assignments',
        description: 'Retrieve a list of all assignments assigned to students with optional filtering.',
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
            name: 'studentID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by student ID',
            required: true,
          } as ParameterObject,
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
            description: 'List of student assignments retrieved successfully',
            content: {
              'application/json': {
                schema: assignmentsForStudentListResponseSchema,
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
        tags: ['Assignments (for Students)'],
        summary: 'Create a new student assignment',
        description: 'Create a new assignment for a specific student or class.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createAssignmentForStudentSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Student assignment created successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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

    '/assignments/student/{id}': {
      get: {
        tags: ['Assignments (for Students)'],
        summary: 'Get student assignment by ID',
        description: 'Retrieve details of a specific student assignment by its ID.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Student assignment details retrieved successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
            description: 'Student assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Assignments (for Students)'],
        summary: 'Update student assignment by ID',
        description: 'Update details of a specific student assignment by its ID.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateAssignmentForStudentSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Student assignment updated successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
          '404': {
            description: 'Student assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/student/draft/{id}': {
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Toggle draft status to drafted.',
        description: 'Toggle the draft status of a student assignment to drafted.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Draft status updated successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/student/undraft/{id}': {
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Toggle draft status to undrafted.',
        description: 'Toggle the draft status of a student assignment to undrafted.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Draft status updated successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/student/delete-for-me/{id}': {
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Delete assignment for me.',
        description: 'Mark assignment as deleted for the current student (soft delete for me).',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment deleted for me successfully',
            content: {
              'application/json': {
                schema: messageResponseSchema,
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
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Assignments (for Students)'],
        summary: 'Delete assignment permanently for me.',
        description: 'Permanently delete assignment for the current student.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment deleted permanently successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
    },

    '/assignments/student/restore-for-me/{id}': {
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Restore assignment for me.',
        description: 'Restore a previously deleted assignment for the current student.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment restored successfully for the student',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/assignments/student/delete-for-everyone/{id}': {
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Delete assignment for everyone.',
        description: 'Mark assignment as deleted for all users (soft delete for everyone).',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment deleted for everyone successfully',
            content: {
              'application/json': {
                schema: messageResponseSchema,
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
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Assignments (for Students)'],
        summary: 'Delete assignment permanently for everyone.',
        description: 'Permanently delete assignment for all users.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment deleted permanently for everyone successfully',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
    },

    '/assignments/student/restore-for-everyone/{id}': {
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Restore assignment for everyone.',
        description: 'Restore a previously deleted assignment for all users.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student Assignment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment restored successfully for everyone',
            content: {
              'application/json': {
                schema: assignmentForStudentResponseSchema,
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
            description: 'Assignment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    //* eBook
    '/assignments/student/ebook/{assignmentId}/{activityId}': {
      get: {
        tags: ['Assignments (for Students)'],
        summary: 'Get ebook assignment',
        description: 'Retrieve an ebook assignment',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'assignmentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Filter assignments by assignmentId',
          } as ParameterObject,
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Filter assignment tasks by ebook activityId',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Assignment ebook task fields',
            content: {
              'application/json': {
                schema: AssignmentEbookResponseSchema,
              },
            },
          },
          '404': {
            description: 'No ebook task found for the specified combination of assignmentId and activityId',
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
      patch: {
        tags: ['Assignments (for Students)'],
        summary: 'Update ebook assignment',
        description: 'Update a task of an ebook assignment',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'assignmentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Filter assignments by assignmentId',
          } as ParameterObject,
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Filter assignment tasks by ebook activityId',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: ebookFieldsToUpdateSchema,
            },
          },
        },
        responses: {
          '204': {
            description: 'No content – ebook task updated successfully',
          },
          '404': {
            description: 'No ebook task found for the specified combination of assignmentId and activityId',
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
    //* eBook
  },
};
