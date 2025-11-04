import {
  authenticateSchema,
  registerSchema,
  refreshSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  AuthResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  ImpersonateStudentParamsSchema,
} from './auth-validate.schemas';
import { UserSchema } from '@components/users/users-validate.schemas';
import { ParameterObject } from 'openapi3-ts/oas31';

export const authOpenApi = {
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and authorization operations',
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user and return tokens',
        description:
          'Authenticate a user with email and password to receive JWT tokens. If X-Customer-Slug header is provided, authentication occurs against the specified customer database.',
        security: [{ CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: authenticateSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Authentication successful. Returns user details and tokens',
            content: {
              'application/json': {
                schema: SuccessResponseSchema.extend({
                  data: AuthResponseSchema,
                }),
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
          '401': {
            description: 'Authentication failed',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Register a new user with the provided details',
        security: [{ CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: registerSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema.extend({
                  data: AuthResponseSchema,
                }),
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Get a new access token using a refresh token',
        security: [{ CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: refreshSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema.extend({
                  data: AuthResponseSchema,
                }),
              },
            },
          },
          '401': {
            description: 'Invalid refresh token',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/auth/verify-email': {
      get: {
        tags: ['Auth'],
        summary: 'Verify email address',
        description: "Verify a user's email address using a verification token",
        security: [{ CustomerSlug: [] }],
        parameters: [
          {
            name: 'token',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Email verification token',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema.extend({
                  data: UserSchema,
                }),
              },
            },
          },
          '400': {
            description: 'Invalid verification token',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset',
        description: 'Request a password reset email',
        security: [{ CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: forgetPasswordSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset email sent',
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
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password',
        description: 'Reset password using a reset token',
        security: [{ CustomerSlug: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: resetPasswordSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '400': {
            description: 'Invalid token or password',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout user',
        description: 'Logout user and invalidate tokens',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: SuccessResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
              },
            },
          },
        },
      },
    },
    '/auth/impersonate/student/{id}': {
      post: {
        tags: ['Auth'],
        summary: 'Impersonate a student (parent login as child)',
        description:
          'Issues student tokens if the authenticated user is allowed to act as the specified student (linked via contact email).',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Student ID to impersonate',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Impersonation successful',
            content: {
              'application/json': {
                schema: SuccessResponseSchema.extend({
                  data: AuthResponseSchema,
                }),
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: ErrorResponseSchema,
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
    },
  },
};
