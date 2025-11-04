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
    academicYear: z.string(),
    academicPeriod: z.string(),
    academicTerm: z.string(),
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
    staffRole: z.enum(['admin', 'manager', 'teacher']),
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
    academicTimeframe: z.object({
      academicYear: z.string().min(1, { message: 'Academic year is required' }),
      academicPeriod: z.string().min(1, { message: 'Academic period is required' }),
      academicTerm: z.string().min(1, { message: 'Academic term is required' }),
    }),
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
    staffRole: z.enum(['admin', 'manager', 'teacher']).optional(),
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
    isDeletedForMe: z.boolean().optional(),
    isDeletedForEveryone: z.boolean().optional(),
    isPermanentlyDeleted: z.boolean().optional(),
  })
  .openapi({
    title: 'UpdateAssignmentForStaff',
    description: 'Schema for updating an existing assignment for staff',
  });

export const queryAssignmentForStaffSchema = z
  .object({
    schoolID: z.string().optional(),
    branchID: z.string().optional(),
    staffID: z.string().optional(),
    staffRole: z.enum(['admin', 'manager', 'teacher']).optional(),
    classID: z.string().optional(),
    studentID: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    academicYear: z.string().optional(),
    academicPeriod: z.string().optional(),
    academicTerm: z.string().optional(),
    isDrafted: z.string().optional(),
    isDeletedForMe: z.string().optional(),
    isDeletedForEveryone: z.string().optional(),
    isPermanentlyDeleted: z.string().optional(),
    status: z.enum(['active', 'upcoming', 'past']).optional(),
  })
  .openapi({
    title: 'QueryAssignmentForStaff',
    description: 'Schema for querying assignments for staff',
  });
