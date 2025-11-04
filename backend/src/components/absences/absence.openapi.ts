import { z } from 'zod';
import {
  absenceCreateSchema,
  absenceUpdateSchema,
  AbsenceReportResponseSchema,
  NotifyParentResponseSchema,
} from './absence-validate.schema';
import { AbsenceStatus } from './absence.interface';
import { ParameterObject } from 'openapi3-ts/oas31';

const sessionSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  id: z.string(),
});

const studentSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  email: z.string(),
  phone: z.string(),
  user_type: z.string(),
  primaryRoleTitle: z.string(),
  class: z.string(),
  id: z.string(),
});

const taxiSchema = z.object({
  name: z.string(),
  id: z.string(),
});

const absenceResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    session: sessionSchema,
    student: studentSchema,
    date: z.string(),
    reason: z.string(),
    status: z.string(),
    taxi: taxiSchema,
    academic_period: z.string(),
    notified_parent: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    id: z.string(),
    note: z.string().optional(),
    notification_date: z.string().optional(),
  }),
});

const absencesListResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
    total: z.number(),
  }),
  data: z.array(
    z.object({
      session: sessionSchema,
      student: studentSchema,
      date: z.string(),
      reason: z.string(),
      status: z.string(),
      taxi: taxiSchema,
      academic_period: z.string(),
      notified_parent: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
      id: z.string(),
      note: z.string().optional(),
      notification_date: z.string().optional(),
    })
  ),
});

const absenceReportResponseSchema = z.object({
  success: z.boolean(),
  data: AbsenceReportResponseSchema,
});

const notifyParentResponseSchema = z.object({
  success: z.boolean(),
  data: NotifyParentResponseSchema,
  message: z.string(),
});

export const absenceOpenApi = {
  tags: [
    {
      name: 'Absences',
      description: 'Absence management operations',
    },
  ],
  paths: {
    '/absences': {
      get: {
        summary: 'Get all absences',
        tags: ['Absences'],
        responses: {
          '200': {
            description: 'List of absences',
            content: {
              'application/json': {
                schema: absencesListResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create a new absence',
        tags: ['Absences'],
        requestBody: {
          content: {
            'application/json': {
              schema: absenceCreateSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Absence created',
            content: {
              'application/json': {
                schema: absenceResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/absences/{id}': {
      get: {
        summary: 'Get single absence',
        tags: ['Absences'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Absence ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Single absence',
            content: {
              'application/json': {
                schema: absenceResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      put: {
        summary: 'Update absence',
        tags: ['Absences'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Absence ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: absenceUpdateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated absence',
            content: {
              'application/json': {
                schema: absenceResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      delete: {
        summary: 'Delete absence',
        tags: ['Absences'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Absence ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Absence deleted',
            content: {
              'application/json': {
                schema: absenceResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/absences/report': {
      get: {
        summary: 'Get absence report',
        tags: ['Absences'],
        parameters: [
          {
            name: 'start_date',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Start date for the report',
          } as ParameterObject,
          {
            name: 'end_date',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'End date for the report',
          } as ParameterObject,
          {
            name: 'student_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by student ID',
          } as ParameterObject,
          {
            name: 'taxi_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by taxi ID',
          } as ParameterObject,
          {
            name: 'academic_period_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic period ID',
          } as ParameterObject,
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: [AbsenceStatus.UNEXCUSED, AbsenceStatus.EXCUSED, AbsenceStatus.JUSTIFIED],
            },
            description: 'Filter by absence status',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Absence report',
            content: {
              'application/json': {
                schema: absenceReportResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/absences/{id}/notify': {
      post: {
        summary: 'Notify parent about absence',
        tags: ['Absences'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Absence ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Parent notified',
            content: {
              'application/json': {
                schema: notifyParentResponseSchema,
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
};
