// src/components/messaging/messaging.openapi.ts
import { z } from 'zod';
import {
  ChatSchema,
  MessageSchema,
  AttachmentSchema,
  ReactionSchema,
  ChatNotificationSchema,
  createChatSchema,
  sendMessageSchema,
  addReactionSchema,
  removeReactionSchema,
  markAsDeliveredSchema,
  markAsReadSchema,
  markChatAsReadSchema,
  updateChatSchema,
  uploadAttachmentsSchema,
  getUploadStatusSchema,
  notificationPaginationSchema,
  systemNotificationSchema,
  createChatNotificationSchema,
} from './messaging-validate.schema';
import { ParameterObject } from 'openapi3-ts/oas31';

// Response schemas
const chatResponse = z.object({ success: z.boolean(), data: ChatSchema });
const chatsListResponse = z.object({ success: z.boolean(), count: z.number(), data: z.array(ChatSchema) });
const messageResponse = z.object({ success: z.boolean(), data: MessageSchema });
const messagesListResponse = z.object({ success: z.boolean(), count: z.number(), data: z.array(MessageSchema) });
const paginatedMessagesResponse = z.object({
  messages: z.array(MessageSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.union([z.number(), z.boolean()]),
    hasMore: z.boolean(),
  }),
});
const attachmentResponse = z.object({ success: z.boolean(), attachment: AttachmentSchema });
const attachmentsListResponse = z.object({ success: z.boolean(), count: z.number(), attachments: z.array(AttachmentSchema) });
const uploadAttachmentsResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  attachments: z.array(AttachmentSchema),
  processing: z.boolean(),
  errors: z.array(z.string()).optional(),
});
const uploadStatusResponse = z.object({ success: z.boolean(), statuses: z.record(z.any()) });
const reactionResponse = z.object({ success: z.boolean(), data: z.any() });
const notificationResponse = z.object({ success: z.boolean(), data: ChatNotificationSchema });
const notificationsListResponse = z.object({
  success: z.boolean(),
  notifications: z.array(ChatNotificationSchema),
  totalCount: z.number(),
  unreadCount: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
});
const unreadCountResponse = z.object({ success: z.boolean(), count: z.number() });
const markAllReadResponse = z.object({ success: z.boolean(), modifiedCount: z.number(), message: z.string() });
const clearNotificationsResponse = z.object({ success: z.boolean(), modifiedCount: z.number(), message: z.string() });

export const messagingOpenApi = {
  tags: [{ name: 'Messaging', description: 'Chat and messaging operations' }],
  paths: {
    // ==================== CHAT ENDPOINTS ====================
    '/messaging/chats/participants/{userId}': {
      get: {
        tags: ['Messaging'],
        summary: 'Get user chats',
        description: 'Get all chats for a specific user with populated participant details',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Chats retrieved successfully',
            content: { 'application/json': { schema: chatsListResponse } },
          },
          '400': { description: 'Invalid user ID' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
    },
    
    '/messaging/chats/{chatId}/reset-unread': {
      post: {
        tags: ['Messaging'],
        summary: 'Reset unread count',
        description: 'Reset unread count for a user in a chat',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Chat ID',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({ userId: z.string().min(1) }),
            },
          },
        },
        responses: {
          '200': { 
            description: 'Unread count reset successfully',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ chatId: z.string(), userId: z.string() }) }) } },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not found' },
        },
      },
    },

    '/messaging/chats/{chatId}': {
    get: {
      tags: ['Messaging'],
      summary: 'Get chat by ID',
      description: 'Retrieve details of a specific chat by ID',
      security: [{ AuthHeader: [], CustomerSlug: [] }],
      parameters: [
        {
          name: 'chatId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Chat ID',
        } as ParameterObject,
      ],
      responses: {
        '200': {
          description: 'Chat retrieved successfully',
          content: { 'application/json': { schema: chatResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Chat not found' },
      },
    },
    patch: {
      tags: ['Messaging'],
      summary: 'Update chat',
      description: 'Update chat settings (user-specific or global)',
      security: [{ AuthHeader: [], CustomerSlug: [] }],
      parameters: [
        {
          name: 'chatId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Chat ID',
        } as ParameterObject,
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: updateChatSchema,
          },
        },
      },
      responses: {
        '200': {
          description: 'Chat updated successfully',
          content: { 'application/json': { schema: chatResponse } },
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Chat not found' },
      },
    },
    delete: {
      tags: ['Messaging'],
      summary: 'Delete chat',
      description: 'Delete a chat and all its messages',
      security: [{ AuthHeader: [], CustomerSlug: [] }],
      parameters: [
        {
          name: 'chatId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Chat ID',
        } as ParameterObject,
      ],
      responses: {
        '200': { 
          description: 'Chat deleted successfully',
          content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ chatId: z.string() }) }) } },
        },
        '400': { description: 'Invalid chat ID' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Chat not found' },
      },
    },
  },

    '/messaging/chats': {
      get: {
        tags: ['Messaging'],
        summary: 'List chats',
        description: 'List chats, optionally filtered by participant user id',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'participant',
            in: 'query',
            schema: { type: 'string' },
            description: 'User ID to filter by',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Chats retrieved successfully',
            content: { 'application/json': { schema: chatsListResponse } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        tags: ['Messaging'],
        summary: 'Create chat',
        description: 'Create a new chat (direct or group)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: { 
          required: true,
          content: { 'application/json': { schema: createChatSchema } } 
        },
        responses: {
          '201': {
            description: 'Chat created successfully',
            content: { 'application/json': { schema: chatResponse } },
          },
          '400': {
            description: 'Invalid input',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/messaging/chats/{chatId}/read': {
      post: {
        tags: ['Messaging'],
        summary: 'Mark chat as read',
        description: 'Mark all messages in a chat as read for a user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Chat ID',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: markChatAsReadSchema,
            },
          },
        },
        responses: {
          '200': { 
            description: 'Chat marked as read',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ updatedCount: z.number() }) }) } },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not found' },
        },
      },
    },

    '/messaging/chats/{chatId}/messages': {
      get: {
        tags: ['Messaging'],
        summary: 'Get messages by chat ID',
        description: 'Retrieve messages for a chat with pagination (legacy endpoint)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Chat ID',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'number', default: 1 },
            description: 'Page number',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 50 },
            description: 'Number of messages per page',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Messages retrieved successfully',
            content: { 'application/json': { schema: paginatedMessagesResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not found' },
        },
      },
    },

    // ==================== MESSAGE ENDPOINTS ====================
    '/messaging/messages': {
      get: {
        tags: ['Messaging'],
        summary: 'Get messages in a chat',
        description: 'Retrieve messages for a chat with optional filtering',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Chat ID',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'string' },
            description: 'Maximum number of messages',
          } as ParameterObject,
          {
            name: 'before',
            in: 'query',
            schema: { type: 'string' },
            description: 'Get messages before this timestamp',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Messages retrieved successfully',
            content: { 'application/json': { schema: messagesListResponse } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Messaging'],
        summary: 'Send message',
        description: 'Send a new message to a chat',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: { 
          required: true,
          content: { 'application/json': { schema: sendMessageSchema } } 
        },
        responses: {
          '201': {
            description: 'Message sent successfully',
            content: { 'application/json': { schema: messageResponse } },
          },
          '400': {
            description: 'Invalid input',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/messaging/messages/{id}/read': {
      patch: {
        tags: ['Messaging'],
        summary: 'Mark message as read',
        description: 'Mark a single message as read',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Message marked as read',
            content: { 'application/json': { schema: messageResponse } },
          },
          '404': {
            description: 'Message not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/messaging/messages/{messageId}/delivered': {
      post: {
        tags: ['Messaging'],
        summary: 'Mark message as delivered',
        description: 'Mark a message as delivered to a user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'messageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: markAsDeliveredSchema,
            },
          },
        },
        responses: {
          '200': { 
            description: 'Message marked as delivered',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ messageId: z.string(), deliveredTo: z.array(z.any()) }) }) } },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Message not found' },
        },
      },
    },

    '/messaging/messages/{messageId}/read': {
      patch: {
        tags: ['Messaging'],
        summary: 'Update read status',
        description: 'Mark a message as read by a user (alternative endpoint)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'messageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: markAsReadSchema,
            },
          },
        },
        responses: {
          '200': { 
            description: 'Read status updated',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ messageId: z.string(), readBy: z.array(z.any()) }) }) } },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Message not found' },
        },
      },
    },

    '/messaging/messages/{messageId}': {
      delete: {
        tags: ['Messaging'],
        summary: 'Delete message',
        description: 'Delete a message (only sender can delete)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'messageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
        ],
        responses: {
          '200': { 
            description: 'Message deleted successfully',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ messageId: z.string(), chatId: z.string() }) }) } },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden - only sender can delete' },
          '404': { description: 'Message not found' },
        },
      },
    },

    '/messaging/incoming/{userId}': {
      get: {
        tags: ['Messaging'],
        summary: 'Get incoming messages',
        description: 'Retrieve all incoming messages for a user with pagination',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'number', default: 1 },
            description: 'Page number',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 50 },
            description: 'Number of messages per page',
          } as ParameterObject,
        ],
        responses: {
          '200': { 
            description: 'Incoming messages retrieved successfully',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.object({ messages: z.array(MessageSchema), pagination: z.object({ page: z.number(), limit: z.number(), hasMore: z.boolean(), total: z.number() }) }) }) } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
    },

    '/messaging/sent/{userId}': {
      get: {
        tags: ['Messaging'],
        summary: 'Get sent messages',
        description: 'Retrieve all sent messages for a user with pagination',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          } as ParameterObject,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'number', default: 1 },
            description: 'Page number',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 50 },
            description: 'Number of messages per page',
          } as ParameterObject,
        ],
        responses: {
          '200': { 
            description: 'Sent messages retrieved successfully',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.object({ messages: z.array(MessageSchema), pagination: z.object({ page: z.number(), limit: z.number(), hasMore: z.boolean(), total: z.number() }) }) }) } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
    },

    // ==================== REACTION ENDPOINTS ====================
    '/messaging/messages/{id}/reactions': {
      post: {
        tags: ['Messaging'],
        summary: 'Add reaction',
        description: 'Add a reaction emoji to a message',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
        ],
        requestBody: { 
          required: true,
          content: { 'application/json': { schema: addReactionSchema } } 
        },
        responses: {
          '201': {
            description: 'Reaction added successfully',
            content: { 'application/json': { schema: reactionResponse } },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Message not found' },
        },
      },
      delete: {
        tags: ['Messaging'],
        summary: 'Remove reaction',
        description: 'Remove a reaction emoji from a message',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
          {
            name: 'emoji',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Emoji to remove',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Reaction removed successfully',
            content: { 'application/json': { schema: reactionResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Message not found' },
        },
      },
    },

    // ==================== ATTACHMENT ENDPOINTS ====================
        '/messaging/attachments/upload': {
      post: {
        tags: ['Messaging'],
        summary: 'Upload attachments',
        description: 'Upload files to a chat or message',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object' as const,  
                properties: {
                  files: {
                    type: 'array' as const,  
                    items: { type: 'string' as const, format: 'binary' as const },
                    description: 'Files to upload',
                  },
                  chatId: { type: 'string' as const },
                  messageId: { type: 'string' as const },
                  userId: { type: 'string' as const },
                },
                required: ['files', 'chatId'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Files uploaded successfully',
            content: { 'application/json': { schema: uploadAttachmentsResponse } },
          },
          '400': { description: 'Invalid input or no files provided' },
          '401': { description: 'Unauthorized' },
          '413': { description: 'File too large' },
        },
      },
    },

    '/messaging/attachments/chat/{chatId}': {
      get: {
        tags: ['Messaging'],
        summary: 'Get chat attachments',
        description: 'Get all attachments for a chat',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Chat ID',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 50 },
            description: 'Maximum number of attachments',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Attachments retrieved successfully',
            content: { 'application/json': { schema: attachmentsListResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not found' },
        },
      },
    },

    '/messaging/attachments/message/{messageId}': {
      get: {
        tags: ['Messaging'],
        summary: 'Get message attachments',
        description: 'Get all attachments for a message',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'messageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Message ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Attachments retrieved successfully',
            content: { 'application/json': { schema: attachmentsListResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Message not found' },
        },
      },
    },

    '/messaging/attachments/{id}': {
      get: {
        tags: ['Messaging'],
        summary: 'Get attachment',
        description: 'Get single attachment by ID',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Attachment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Attachment retrieved successfully',
            content: { 'application/json': { schema: attachmentResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Attachment not found' },
        },
      },
      delete: {
        tags: ['Messaging'],
        summary: 'Delete attachment',
        description: 'Delete an attachment (only uploader can delete)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Attachment ID',
          } as ParameterObject,
        ],
        responses: {
          '200': { 
            description: 'Attachment deleted successfully',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string() }) } },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden - only uploader can delete' },
          '404': { description: 'Attachment not found' },
        },
      },
    },

    '/messaging/attachments/{id}/download': {
      get: {
        tags: ['Messaging'],
        summary: 'Download attachment',
        description: 'Download/redirect to attachment URL',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Attachment ID',
          } as ParameterObject,
        ],
        responses: {
          '302': { description: 'Redirect to file URL' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'File not ready or failed virus scan' },
          '404': { description: 'Attachment not found' },
        },
      },
    },

    '/messaging/attachments/status': {
      post: {
        tags: ['Messaging'],
        summary: 'Get upload status',
        description: 'Get upload status for multiple attachments',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: getUploadStatusSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Upload status retrieved successfully',
            content: { 'application/json': { schema: uploadStatusResponse } },
          },
          '400': { description: 'Invalid attachment IDs provided' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ==================== NOTIFICATION ENDPOINTS ====================
    '/messaging/notifications': {
      get: {
        tags: ['Messaging'],
        summary: 'Get user notifications',
        description: 'Get notifications for a user with pagination',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'number', default: 1 },
            description: 'Page number',
          } as ParameterObject,
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 20 },
            description: 'Number of notifications per page',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Notifications retrieved successfully',
            content: { 'application/json': { schema: notificationsListResponse } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/messaging/notifications/unread/count': {
      get: {
        tags: ['Messaging'],
        summary: 'Get unread count',
        description: 'Get unread notifications count for current user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'Unread count retrieved successfully',
            content: { 'application/json': { schema: unreadCountResponse } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/messaging/notifications/{id}/read': {
      patch: {
        tags: ['Messaging'],
        summary: 'Mark notification as read',
        description: 'Mark a single notification as read',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Notification ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Notification marked as read',
            content: { 'application/json': { schema: notificationResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Notification not found' },
        },
      },
    },

    '/messaging/notifications/read/all': {
      post: {
        tags: ['Messaging'],
        summary: 'Mark all as read',
        description: 'Mark all notifications as read for current user',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'All notifications marked as read',
            content: { 'application/json': { schema: markAllReadResponse } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/messaging/notifications/{id}': {
      delete: {
        tags: ['Messaging'],
        summary: 'Delete notification',
        description: 'Soft delete a notification',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Notification ID',
          } as ParameterObject,
        ],
        responses: {
          '200': {
            description: 'Notification deleted successfully',
            content: { 'application/json': { schema: notificationResponse } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Notification not found' },
        },
      },
    },

    '/messaging/notifications/clear': {
      post: {
        tags: ['Messaging'],
        summary: 'Clear all notifications',
        description: 'Clear all notifications for current user (soft delete)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        responses: {
          '200': {
            description: 'All notifications cleared',
            content: { 'application/json': { schema: clearNotificationsResponse } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/messaging/notifications/system': {
      post: {
        tags: ['Messaging'],
        summary: 'Create system notification',
        description: 'Create system notification for multiple users (admin only)',
        security: [{ AuthHeader: [], CustomerSlug: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: systemNotificationSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'System notifications created successfully',
            content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(ChatNotificationSchema) }) } },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden - admin only' },
        },
      },
    },
    '/messaging/notifications/type/{type}': {
  get: {
    tags: ['Messaging'],
    summary: 'Get notifications by type',
    description: 'Get notifications filtered by type with pagination',
    security: [{ AuthHeader: [], CustomerSlug: [] }],
    parameters: [
      {
        name: 'type',
        in: 'path',
        required: true,
        schema: { 
          type: 'string',
          enum: ['message', 'mention', 'system', 'chat_invite', 'user_online', 'user_offline']
        },
        description: 'Notification type',
      } as ParameterObject,
      {
        name: 'page',
        in: 'query',
        schema: { type: 'number', default: 1 },
        description: 'Page number',
      } as ParameterObject,
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'number', default: 10 },
        description: 'Number of notifications per page',
      } as ParameterObject,
    ],
    responses: {
      '200': {
        description: 'Notifications retrieved successfully',
        content: { 
          'application/json': { 
            schema: z.object({
              success: z.boolean(),
              notifications: z.array(ChatNotificationSchema),
              totalCount: z.number(),
              currentPage: z.number(),
              totalPages: z.number()
            })
          } 
        },
      },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};