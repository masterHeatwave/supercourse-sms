import { ParameterObject } from 'openapi3-ts/oas31';
import { z } from 'zod';
import { ActivitySchema } from '@components/activity/activity-validate.schema';

export const dashboardOpenApi = {
  tags: [
    {
      name: 'Dashboard',
      description: 'Dashboard data operations',
    },
  ],
  paths: {
    '/dashboard/{customer_id}': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard data for a customer',
        description: 'Retrieve dashboard data for a specific customer',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'customer_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Dashboard data retrieved successfully',
            content: {
              'application/json': {
                schema: z
                  .object({
                    success: z.boolean(),
                    data: z.object({
                      customer: z.object({
                        _id: z.string(),
                        name: z.string(),
                        // Other customer fields omitted for brevity
                      }),
                      date: z.string(),
                      currentWeek: z.number(),
                      students_count: z.number(),
                      staff_count: z.number(),
                      taxis_count: z.number(),
                      ongoing_sessions: z.number(),
                      recent_activities: z.array(ActivitySchema),
                    }),
                  })
                  .openapi({ title: 'DashboardResponse' }),
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
            description: 'Customer not found',
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
