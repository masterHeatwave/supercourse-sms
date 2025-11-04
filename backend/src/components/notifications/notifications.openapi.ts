import { ParameterObject } from 'openapi3-ts/oas31';

export const notificationsOpenApi = {
  tags: [
    {
      name: 'Notifications',
      description: 'Notification management operations',
    },
  ],
  paths: {
    '/notifications/{distributorId}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get all notifications',
        description: 'Retrieve a list of all notifications for a specific distributor',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'distributorId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Distributor ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'List of notifications retrieved successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Distributor not found',
          },
        },
      },
    },
    '/notifications/{notificationId}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        description: 'Mark a specific notification as read',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'notificationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Notification ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Notification marked as read successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Notification not found',
          },
        },
      },
    },
  },
};
