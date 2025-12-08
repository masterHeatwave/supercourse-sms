import 'zod-openapi/extend';
import { z } from 'zod';

const AssignmentTaskSchema = z
  .object({
    resourceType: z.enum(['ebook', 'custom-activity', 'open-task']),
    ebookID: z.string().optional(),
    ebookActivityID: z.string().optional(),
    customActivityID: z.string().optional(),
    openTaskType: z.enum(['speaking', 'writing']).optional(),
    openTaskTitle: z.string().optional(),
    openTaskInstructions: z.string().optional(),
    assignedAs: z.enum(['exercise', 'exam']),
    instructions: z.string().optional(),
  })
  .openapi({
    title: 'AssignmentTaskForStaff',
    description: 'Task details for an assignment',
  });

const AssignmentAcademicTimeframeSchema = z
  .object({
    academicYear: z.string().min(1, { message: 'Academic year ID is required' }),
    academicPeriod: z.string().min(1, { message: 'Academic period ID is required' }),
    academicTerm: z.string().min(1, { message: 'Academic term ID is required' }),
  })
  .openapi({
    title: 'AssignmentAcademicTimeframe',
    description: 'Academic timeframe for an assignment',
  });

export const AssignmentForStaffSchema = z
  .object({
    _id: z.string(),
    schoolID: z.string().or(
      z.object({
        _id: z.string(),
        name: z.string(),
      })
    ),
    branchID: z.string().or(
      z.object({
        _id: z.string(),
        name: z.string(),
      })
    ),
    staffID: z.string().or(
      z.object({
        _id: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email().optional(),
      })
    ),
    staffRole: z.enum(['admin', 'manager', 'teacher']),
    classID: z
      .string()
      .or(
        z.object({
          _id: z.string(),
          name: z.string(),
        })
      )
      .optional(),
    studentsIDs: z
      .array(
        z.string().or(
          z.object({
            _id: z.string(),
            firstname: z.string(),
            lastname: z.string(),
            email: z.string().email().optional(),
          })
        )
      )
      .optional(),
    title: z.string(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    description: z.string().optional(),
    tasks: z.array(AssignmentTaskSchema).optional(),
    academicTimeframe: AssignmentAcademicTimeframeSchema,
    isDrafted: z.boolean(),
    draftDate: z.string().or(z.date()).optional(),
    isDeletedForMe: z.boolean(),
    deletedForMeDate: z.string().or(z.date()).optional(),
    isDeletedForEveryone: z.boolean(),
    deletedForEveryoneDate: z.string().or(z.date()).optional(),
    isPermanentlyDeleted: z.boolean(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .openapi({
    title: 'AssignmentForStaff',
    description: 'Assignment for staff model',
  });

export const createAssignmentForStaffSchema = z
  .object({
    schoolID: z.string().min(1, { message: 'School ID is required' }),
    branchID: z.string().min(1, { message: 'Branch ID is required' }),
    staffID: z.string().min(1, { message: 'Staff ID is required' }),
    staffRole: z.enum(['admin', 'manager', 'teacher'], {
      errorMap: () => ({ message: 'Staff role must be admin, manager, or teacher' }),
    }),
    classID: z.string().optional(),
    studentsIDs: z.array(z.string()).optional(),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title cannot be more than 200 characters' }),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    description: z.string().optional(),
    tasks: z.array(AssignmentTaskSchema).optional(),
    academicTimeframe: AssignmentAcademicTimeframeSchema,
    isDrafted: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .openapi({
    title: 'CreateAssignmentForStaff',
    description: 'Schema for creating a new assignment for staff',
  });

export const updateAssignmentForStaffSchema = z
  .object({
    schoolID: z.string().optional(),
    branchID: z.string().optional(),
    staffID: z.string().optional(),
    staffRole: z
      .enum(['admin', 'manager', 'teacher'], {
        errorMap: () => ({ message: 'Staff role must be admin, manager, or teacher' }),
      })
      .optional(),
    classID: z.string().optional(),
    studentsIDs: z.array(z.string()).optional(),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title cannot be more than 200 characters' })
      .optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    description: z.string().optional(),
    tasks: z.array(AssignmentTaskSchema).optional(),
    academicTimeframe: z
      .object({
        academicYear: z.string().optional(),
        academicPeriod: z.string().optional(),
        academicTerm: z.string().optional(),
      })
      .optional(),
    isDrafted: z.boolean().optional(),
    draftDate: z.string().or(z.date()).optional(),
    isDeletedForMe: z.boolean().optional(),
    deletedForMeDate: z.string().or(z.date()).optional(),
    isDeletedForEveryone: z.boolean().optional(),
    deletedForEveryoneDate: z.string().or(z.date()).optional(),
    isPermanentlyDeleted: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .openapi({
    title: 'UpdateAssignmentForStaff',
    description: 'Schema for updating an existing assignment for staff',
  });

export const queryAssignmentForStaffSchema = z
  .object({
    branchID: z.string().optional(),
    staffRole: z.enum(['admin', 'manager', 'teacher']).optional(),
    staffID: z.string().optional(),
    classID: z.string().optional(),
    academicYearID: z.string().optional(),
    academicPeriodID: z.string().optional(),
    academicSubperiodID: z.string().optional(),
    isDrafted: z.string().optional(),
    isDeletedForMe: z.string().optional(),
    isDeletedForEveryone: z.string().optional(),
  })
  .openapi({
    title: 'QueryAssignmentForStaff',
    description: 'Schema for querying assignments for staff',
  });

export const getAssignmentByIDQuerySchema = z
  .object({
    staffID: z.string().min(1, { message: 'Staff ID is required for authorization' }),
    staffRole: z.enum(['admin', 'manager', 'teacher'], {
      errorMap: () => ({ message: 'Staff role must be admin, manager, or teacher' }),
    }),
    branchID: z.string().min(1, { message: 'Branch ID is required for authorization' }),
  })
  .openapi({
    title: 'GetAssignmentByIDQuery',
    description: 'Query parameters required for authorization when retrieving an assignment by ID',
  });

export const authorizationQuerySchema = z
  .object({
    staffID: z.string().min(1, { message: 'Staff ID is required for authorization' }),
    staffRole: z.enum(['admin', 'manager', 'teacher'], {
      errorMap: () => ({ message: 'Staff role must be admin, manager, or teacher' }),
    }),
    branchID: z.string().min(1, { message: 'Branch ID is required for authorization' }),
  })
  .openapi({
    title: 'AuthorizationQuery',
    description: 'Query parameters required for authorization across assignment operations',
  });

export const updateAssignmentQuerySchema = authorizationQuerySchema;
export const draftAssignmentQuerySchema = authorizationQuerySchema;
export const undraftAssignmentQuerySchema = authorizationQuerySchema;
export const deleteAssignmentForMeQuerySchema = authorizationQuerySchema;
export const restoreAssignmentForMeQuerySchema = authorizationQuerySchema;
export const deleteAssignmentForEveryoneQuerySchema = authorizationQuerySchema;
export const restoreAssignmentForEveryoneQuerySchema = authorizationQuerySchema;
