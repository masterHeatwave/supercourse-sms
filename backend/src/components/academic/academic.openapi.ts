import { academicYearCreateSchema, academicYearUpdateSchema } from './academic-validate.schema';
import {
  createAcademicSubperiodSchema as academicSubperiodCreateSchema,
  updateAcademicSubperiodSchema as academicSubperiodUpdateSchema,
} from './academic-subperiods-validate.schema';
import { createAcademicPeriodSchema, updateAcademicPeriodSchema } from './academic-periods-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';

export const academicOpenApi = {
  tags: [
    {
      name: 'Academic Years',
      description: 'Academic year management operations',
    },
    {
      name: 'Academic Periods',
      description: 'Academic period management operations',
    },
    {
      name: 'Academic Subperiods',
      description: 'Academic subperiod management operations',
    },
    {
      name: 'Academic Overview',
      description: 'Aggregated academic overview: years, periods, branches, classes, and roles',
    },
  ],
  paths: {
    '/academic-years': {
      get: {
        tags: ['Academic Years'],
        summary: 'Get all academic years',
        description: 'Retrieve a list of all academic years',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'List of academic years retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        tags: ['Academic Years'],
        summary: 'Create a new academic year',
        description: 'Create a new academic year with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: academicYearCreateSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Academic year created successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/academic-overview': {
      get: {
        tags: ['Academic Overview'],
        summary: 'Get academic overview',
        description:
          'Returns an aggregated overview of academic years and their periods including branches, classes, and key roles (administrators, managers, teachers).',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Overview retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/academic-overview/staff/{userId}': {
      get: {
        tags: ['Academic Overview'],
        summary: 'Get academic overview for a specific staff member',
        description:
          'Returns an aggregated overview filtered for a given staff member (teacher/administrator/manager), including only periods and classes relevant to them.',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff user ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Overview for staff retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'User not found',
          },
        },
      },
    },
    '/academic-years/{id}': {
      get: {
        tags: ['Academic Years'],
        summary: 'Get academic year by ID',
        description: 'Retrieve details of a specific academic year by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic year ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Academic year details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic year not found',
          },
        },
      },
      put: {
        tags: ['Academic Years'],
        summary: 'Update academic year',
        description: 'Update details of a specific academic year',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic year ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: academicYearUpdateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Academic year updated successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic year not found',
          },
        },
      },
      delete: {
        tags: ['Academic Years'],
        summary: 'Delete academic year',
        description: 'Delete a specific academic year',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic year ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Academic year deleted successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic year not found',
          },
        },
      },
    },
    '/academic-years/current': {
      get: {
        tags: ['Academic Years'],
        summary: 'Get current academic year',
        description: 'Retrieve the current academic year',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Current academic year details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'No current academic year found',
          },
        },
      },
    },
    '/academic-years/selected': {
      get: {
        tags: ['Academic Years'],
        summary: 'Get currently selected (from school settings) academic year',
        description: 'Retrieve the currently selected academic year',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Selected academic year details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'No selected academic year found',
          },
        },
      },
    },
    '/academic-years/status/dual': {
      get: {
        tags: ['Academic Years'],
        summary: 'Get manually selected and currnet (ημερολογιακό) academic year together! (/current + /selected)',
        description: 'Retrieve both the currently selected and the current (ημερολογιακό) academic year',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Selected and current academic year details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'No selected or current academic year found',
          },
        },
      },
    },
    '/academic-periods': {
      get: {
        tags: ['Academic Periods'],
        summary: 'Get all academic periods',
        description: 'Retrieve a list of all academic periods with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'academic_year',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic year ID',
          } as ParameterObject,
          {
            name: 'current',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by current status',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of academic periods retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        tags: ['Academic Periods'],
        summary: 'Create a new academic period',
        description: 'Create a new academic period with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createAcademicPeriodSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Academic period created successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/academic-periods/{id}': {
      get: {
        tags: ['Academic Periods'],
        summary: 'Get academic period by ID',
        description: 'Retrieve details of a specific academic period by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic period ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Academic period details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic period not found',
          },
        },
      },
      put: {
        tags: ['Academic Periods'],
        summary: 'Update academic period',
        description: 'Update details of a specific academic period',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic period ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: updateAcademicPeriodSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Academic period updated successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic period not found',
          },
        },
      },
      delete: {
        tags: ['Academic Periods'],
        summary: 'Delete academic period',
        description: 'Delete a specific academic period',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic period ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Academic period deleted successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic period not found',
          },
        },
      },
    },
    '/academic-periods/current': {
      get: {
        tags: ['Academic Periods'],
        summary: 'Get current academic period',
        description: 'Retrieve the current academic period',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Current academic period details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'No current academic period found',
          },
        },
      },
    },
    '/academic-subperiods': {
      get: {
        tags: ['Academic Subperiods'],
        summary: 'Get all academic subperiods',
        description: 'Retrieve a list of all academic subperiods',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'academic_period',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by academic period ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of academic subperiods retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        tags: ['Academic Subperiods'],
        summary: 'Create a new academic subperiod',
        description: 'Create a new academic subperiod with the given details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: academicSubperiodCreateSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Academic subperiod created successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/academic-subperiods/{id}': {
      get: {
        tags: ['Academic Subperiods'],
        summary: 'Get academic subperiod by ID',
        description: 'Retrieve details of a specific academic subperiod by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic subperiod ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Academic subperiod details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic subperiod not found',
          },
        },
      },
      put: {
        tags: ['Academic Subperiods'],
        summary: 'Update academic subperiod',
        description: 'Update details of a specific academic subperiod',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic subperiod ID',
          } as ParameterObject,
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: academicSubperiodUpdateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Academic subperiod updated successfully',
          },
          '400': {
            description: 'Invalid input',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic subperiod not found',
          },
        },
      },
      delete: {
        tags: ['Academic Subperiods'],
        summary: 'Delete academic subperiod',
        description: 'Delete a specific academic subperiod',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Academic subperiod ID',
          } as ParameterObject,
        ],
        responses: {
          '204': {
            description: 'Academic subperiod deleted successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Academic subperiod not found',
          },
        },
      },
    },
    '/academic-subperiods/current': {
      get: {
        tags: ['Academic Subperiods'],
        summary: 'Get current academic subperiod',
        description: 'Retrieve the current academic subperiod',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Current academic subperiod details retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'No current academic subperiod found',
          },
        },
      },
    },
  },
};
