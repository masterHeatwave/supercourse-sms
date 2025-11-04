import {

  updateStudentTaskSchema,
  AssignmentForStudentSchema,
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
    '/assignments/students': {
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
          } as ParameterObject,
          {
            name: 'classID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by class ID',
          } as ParameterObject,
          {
            name: 'staffID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by staff member ID who created the assignment',
          } as ParameterObject,
          {
            name: 'staffAssignmentID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by staff assignment ID',
          } as ParameterObject,
          {
            name: 'academicYearID',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic year ID',
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
            name: 'assignmentStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['new', 'in-progress', 'completed'],
            },
            description: 'Filter by assignment status',
          } as ParameterObject,
          {
            name: 'taskStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['new', 'in-progress', 'completed'],
            },
            description: 'Filter by task status',
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
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['active', 'upcoming', 'past'],
            },
            description: 'Filter by time status (active, upcoming, or past)',
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
    },

    '/assignments/students/{id}': {
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
    },

    // '/assignments/students/{id}/task/{task-id}': {
    //   patch: {
    //     tags: ['Assignments (for Students)'],
    //     summary: 'Update a specific task in student assignment',
    //     description: 'Update task details such as attempts, score, answers, and status.',
    //     security: [{ AuthHeader: [], CustomerSlug: [] }],
    //     parameters: [
    //       {
    //         name: 'id',
    //         in: 'path',
    //         required: true,
    //         schema: { type: 'string' },
    //         description: 'Student Assignment ID',
    //       } as ParameterObject,
    //       {
    //         name: 'taskIndex',
    //         in: 'path',
    //         required: true,
    //         schema: { type: 'number' },
    //         description: 'Index of the task in the tasks array',
    //       } as ParameterObject,
    //     ],
    //     requestBody: {
    //       content: {
    //         'application/json': {
    //           schema: updateStudentTaskSchema,
    //         },
    //       },
    //     },
    //     responses: {
    //       '200': {
    //         description: 'Task updated successfully',
    //         content: {
    //           'application/json': {
    //             schema: assignmentForStudentResponseSchema,
    //           },
    //         },
    //       },
    //       '400': {
    //         description: 'Invalid input - validation error',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/Error' },
    //           },
    //         },
    //       },
    //       '401': {
    //         description: 'Unauthorized',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/Error' },
    //           },
    //         },
    //       },
    //       '404': {
    //         description: 'Student assignment or task not found',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/Error' },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },

    // '/assignments/students/{id}/status/{status-id}': {
    //   patch: {
    //     tags: ['Assignments (for Students)'],
    //     summary: 'Update assignment status',
    //     description: 'Update the overall status of a student assignment (new, in-progress, completed).',
    //     security: [{ AuthHeader: [], CustomerSlug: [] }],
    //     parameters: [
    //       {
    //         name: 'id',
    //         in: 'path',
    //         required: true,
    //         schema: { type: 'string' },
    //         description: 'Student Assignment ID',
    //       } as ParameterObject,
    //     ],
    //     requestBody: {
    //       content: {
    //         'application/json': {
    //           schema: z.object({
    //             assignmentStatus: z.enum(['new', 'in-progress', 'completed']),
    //           }),
    //         },
    //       },
    //     },
    //     responses: {
    //       '200': {
    //         description: 'Assignment status updated successfully',
    //         content: {
    //           'application/json': {
    //             schema: assignmentForStudentResponseSchema,
    //           },
    //         },
    //       },
    //       '400': {
    //         description: 'Invalid input - validation error',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/Error' },
    //           },
    //         },
    //       },
    //       '401': {
    //         description: 'Unauthorized',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/Error' },
    //           },
    //         },
    //       },
    //       '404': {
    //         description: 'Student assignment not found',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/Error' },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
  },
};
