import { createDocument } from 'zod-openapi';
import { z } from 'zod';
import { usersOpenApi } from '@components/users/users.openapi';
import { authOpenApi } from '@components/auth/auth.openapi';
import { academicOpenApi } from '@components/academic/academic.openapi';
import { classroomOpenApi } from '@components/classrooms/classroom.openapi';
import { customerOpenApi } from '@components/customers/customer.openapi';
import { dashboardOpenApi } from '@components/dashboard/dashboard.openapi';
import { errorOpenApi } from '@components/error/error.openapi';
import { inventoryOpenApi } from '@components/inventory/inventory.openapi';
import { notificationsOpenApi } from '@components/notifications/notifications.openapi';
import { postOpenApi } from '@components/posts/post.openapi';
import { roleOpenApi } from '@components/roles/role.openapi';
import { sessionOpenApi } from '@components/sessions/session.openapi';
import { taxiOpenApi } from '@components/taxi/taxi.openapi';
import { absenceOpenApi } from '@components/absences/absence.openapi';
import { activityOpenApi } from '@components/activity/activity.openapi';
import { materialsOpenApi, MaterialSchema } from '@components/materials/materials.openapi';
import { messagingOpenApi } from '@components/messaging/messaging.openapi';
import { UserSchema } from '@components/users/users-validate.schemas';
import { ClassroomSchema } from '@components/classrooms/classroom-validate.schema';
import { CustomerSchema } from '@components/customers/customer-validate.schema';
import { SessionSchema } from '@components/sessions/session-validate.schema';
import { TaxiSchema } from '@components/taxi/taxi-validate.schema';
import { InventorySchema } from '@components/inventory/inventory-validate.schema';
import { PostSchema } from '@components/posts/post-validate.schema';
import { RoleSchema, PermissionSchema } from '@components/roles/role-validate.schemas';
import { ErrorItemSchema } from '@components/error/error-validate.schema';
import { absenceCreateSchema } from '@components/absences/absence-validate.schema';
import { ActivitySchema } from '@components/activity/activity-validate.schema';
import {
  ChatSchema as ChatModelSchema,
  MessageSchema as MessageModelSchema,
} from '@components/messaging/messaging-validate.schema';
import { assignmentStaffOpenApi } from '@components/assignments/assignment-staff.openapi';
import { AssignmentForStaffSchema } from '@components/assignments/assignment-staff-validate.schema';
import { assignmentStudentOpenApi } from '@components/assignments/assignment-student.openapi';
import { AssignmentForStudentSchema } from '@components/assignments/assignment-student-validate.schema';
import { MoodSchema, MoodVideoSchema } from '@components/wellness-center/mood-validate.schema';
import { moodOpenApi } from '@components/wellness-center/mood.openapi';
import { bookmarkOpenApi } from '@components/bookmarks/bookmark.openapi';
import { BookmarkSchema } from '@components/bookmarks/bookmark-validate.schema';
import { customActivityOpenApi } from '@components/custom-activities/customActivity.openapi';
import { CustomActivitySchema } from '@components/custom-activities/customActivity-validate.schema';


// Common schemas that can be reused across different endpoints
const commonSchemas = {
  Error: z.object({
    statusCode: z.number().describe('HTTP status code'),
    message: z.string().describe('Error message'),
    error: z.string().describe('Error type'),
  }),
  Pagination: z.object({
    page: z.number().describe('Current page number'),
    limit: z.number().describe('Number of items per page'),
    total: z.number().describe('Total number of items'),
    totalPages: z.number().describe('Total number of pages'),
  }),
  User: UserSchema,
  Classroom: ClassroomSchema,
  Customer: CustomerSchema,
  Session: SessionSchema,
  Taxi: TaxiSchema,
  Inventory: InventorySchema,
  Post: PostSchema,
  Role: RoleSchema,
  Permission: PermissionSchema,
  ErrorItem: ErrorItemSchema,
  Absence: absenceCreateSchema,
  Activity: ActivitySchema,
  Material: MaterialSchema,
  Chat: ChatModelSchema,
  Message: MessageModelSchema,
  AssignmentForStaff: AssignmentForStaffSchema,
  AssignmentForStudent: AssignmentForStudentSchema,
  Mood: MoodSchema,
  MoodVideo: MoodVideoSchema,
  Bookmark: BookmarkSchema,
  CustomActivity: CustomActivitySchema,
};

export const openApiDocument = createDocument({
  openapi: '3.0.0',
  info: {
    title: 'Supercourse SMS API',
    version: '1.0.0',
    description: 'API documentation for the Supercourse SMS service',
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}/v1`,
      description: 'Development server',
    },
    {
      url: 'https://api-sms.supercourse.dd.softwebpages.com/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      AuthHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-ss-auth',
        description: 'Authentication header in format: roleId:jwtToken:userId',
      },
      ApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for internal API access',
      },
      CustomerSlug: {
        type: 'apiKey',
        in: 'header',
        name: 'x-customer-slug',
        description: 'Customer slug for internal API access',
      },
    },
    schemas: commonSchemas,
    parameters: {
      CustomerSlugHeader: {
        name: 'X-Customer-Slug',
        in: 'header',
        required: false,
        description: 'Optional. The slug identifying the customer database context for the request.',
        schema: { type: 'string' },
      },
    },
  },
  security: [
    {
      AuthHeader: [],
    },
  ],
  tags: [
    ...usersOpenApi.tags,
    ...authOpenApi.tags,
    ...academicOpenApi.tags,
    ...classroomOpenApi.tags,
    ...customerOpenApi.tags,
    ...dashboardOpenApi.tags,
    ...errorOpenApi.tags,
    ...inventoryOpenApi.tags,
    ...notificationsOpenApi.tags,
    ...postOpenApi.tags,
    ...roleOpenApi.tags,
    ...sessionOpenApi.tags,
    ...taxiOpenApi.tags,
    ...activityOpenApi.tags,
    { name: 'Absences', description: 'Absence management operations' },
    ...materialsOpenApi.tags,
    ...messagingOpenApi.tags,
    ...assignmentStaffOpenApi.tags,
    ...assignmentStudentOpenApi.tags,
    ...moodOpenApi.tags,
    ...bookmarkOpenApi.tags,
    ...customActivityOpenApi.tags,
  ],
  paths: {
    ...usersOpenApi.paths,
    ...authOpenApi.paths,
    ...academicOpenApi.paths,
    ...classroomOpenApi.paths,
    ...customerOpenApi.paths,
    ...dashboardOpenApi.paths,
    ...errorOpenApi.paths,
    ...inventoryOpenApi.paths,
    ...notificationsOpenApi.paths,
    ...postOpenApi.paths,
    ...roleOpenApi.paths,
    ...sessionOpenApi.paths,
    ...taxiOpenApi.paths,
    ...absenceOpenApi.paths,
    ...activityOpenApi.paths,
    ...materialsOpenApi.paths,
    ...messagingOpenApi.paths,
    ...assignmentStaffOpenApi.paths,
    ...assignmentStudentOpenApi.paths,
    ...moodOpenApi.paths,
    ...bookmarkOpenApi.paths,
    ...customActivityOpenApi.paths,
  },
});
