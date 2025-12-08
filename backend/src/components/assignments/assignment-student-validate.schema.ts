import 'zod-openapi/extend';
import { z } from 'zod';

//* eBook
import mongoose from 'mongoose';
//* eBook

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
    attempts: z.number().min(0).default(0),
    duration: z.number().min(0).default(0),
    score: z.number().min(0).default(0),
    taskStatus: z.enum(['new', 'in-progress', 'completed']).default('new'),
    answers: z.any().optional(),
    answersRevealed: z.boolean().default(false),
  })
  .openapi({
    title: 'AssignmentTaskForStudent',
    description: 'Task details for an assignment',
  });

const CreateAssignmentTaskSchema = z
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
    attempts: z.number().min(0).default(0),
    duration: z.number().min(0).default(0),
    score: z.number().min(0).default(0),
    taskStatus: z.enum(['new', 'in-progress', 'completed']).optional().default('new'),
    answers: z.any().optional(),
    answersRevealed: z.boolean().optional().default(false),
  })
  .openapi({
    title: 'CreateAssignmentTask',
    description: 'Task details for creating an assignment',
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

export const AssignmentForStudentSchema = z
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
    staffAssignmentID: z.string(),
    classID: z
      .string()
      .or(
        z.object({
          _id: z.string(),
          name: z.string(),
        })
      )
      .optional(),
    studentID: z
      .string()
      .or(
        z.object({
          _id: z.string(),
          firstname: z.string(),
          lastname: z.string(),
          email: z.string().email().optional(),
        })
      )
      .optional(),
    title: z.string(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    description: z.string().optional(),
    tasks: z.array(AssignmentTaskSchema).optional(),
    assignmentStatus: z.enum(['new', 'in-progress', 'completed']),
    academicTimeframe: AssignmentAcademicTimeframeSchema,
    isDrafted: z.boolean(),
    draftDate: z.string().or(z.date()).optional(),
    isDeletedForMe: z.boolean(),
    deleteDateForMe: z.string().or(z.date()).optional(),
    isDeletedForEveryone: z.boolean(),
    deleteDateForEveryone: z.string().or(z.date()).optional(),
    isPermanentlyDeleted: z.boolean(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .openapi({
    title: 'AssignmentForStudent',
    description: 'Assignment for student model',
  });

export const updateStudentTaskSchema = z
  .object({
    attempts: z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    score: z.number().min(0).optional(),
    taskStatus: z.enum(['new', 'in-progress', 'completed']).optional(),
    answers: z.any().optional(),
    answersRevealed: z.boolean().optional(),
  })
  .openapi({
    title: 'UpdateStudentTask',
    description: 'Schema for updating a student task within an assignment',
  });

export const createAssignmentForStudentSchema = z
  .object({
    schoolID: z.string().min(1, { message: 'School ID is required' }),
    branchID: z.string().min(1, { message: 'Branch ID is required' }),
    staffID: z.string().min(1, { message: 'Staff ID is required' }),
    staffRole: z.enum(['admin', 'manager', 'teacher'], {
      errorMap: () => ({ message: 'Staff role must be admin, manager, or teacher' }),
    }),
    staffAssignmentID: z.string().min(1, { message: 'Staff assignment ID is required' }),
    classID: z.string().optional(),
    studentID: z.string().optional(),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title cannot be more than 200 characters' }),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    description: z.string().optional(),
    tasks: z.array(CreateAssignmentTaskSchema).optional(),
    assignmentStatus: z.enum(['new', 'in-progress', 'completed']).optional().default('new'),
    academicTimeframe: AssignmentAcademicTimeframeSchema,
    isDrafted: z.boolean().optional().default(false),
    isDeletedForMe: z.boolean().optional().default(false),
    deleteDateForMe: z.string().or(z.date()).optional(),
    isDeletedForEveryone: z.boolean().optional().default(false),
    deleteDateForEveryone: z.string().or(z.date()).optional(),
    isPermanentlyDeleted: z.boolean().optional().default(false),
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
    title: 'CreateAssignmentForStudent',
    description: 'Schema for creating an assignment for students',
  });

export const updateAssignmentForStudentSchema = z
  .object({
    schoolID: z.string().optional(),
    branchID: z.string().optional(),
    staffID: z.string().optional(),
    staffRole: z
      .enum(['admin', 'manager', 'teacher'], {
        errorMap: () => ({ message: 'Staff role must be admin, manager, or teacher' }),
      })
      .optional(),
    staffAssignmentID: z.string().optional(),
    classID: z.string().optional(),
    studentID: z.string().optional(),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title cannot be more than 200 characters' })
      .optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    description: z.string().optional(),
    tasks: z.array(AssignmentTaskSchema).optional(),
    assignmentStatus: z.enum(['new', 'in-progress', 'completed']).optional(),
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
    deleteDateForMe: z.string().or(z.date()).optional(),
    isDeletedForEveryone: z.boolean().optional(),
    deleteDateForEveryone: z.string().or(z.date()).optional(),
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
    title: 'UpdateAssignmentForStudent',
    description: 'Schema for updating an existing assignment for students',
  });

export const queryAssignmentForStudentSchema = z
  .object({
    branchID: z.string().optional(),
    studentID: z.string().optional(),
    academicYearID: z.string().optional(),
    academicPeriodID: z.string().optional(),
    academicSubperiodID: z.string().optional(),
    isDeletedForMe: z.string().optional(),
    isDeletedForEveryone: z.string().optional(),
  })
  .openapi({
    title: 'QueryAssignmentForStudent',
    description: 'Schema for querying assignments for students',
  });

//* eBook
export const getEbookAssignmentSchema = z
  .object({
    assignmentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid assignmentId' }),
    activityId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid activityId' }),
  })
  .openapi({
    title: 'QueryEbookAssignment',
    description: 'Schema for querying ebook assignments',
  });

export const ebookFieldsToUpdateSchema = z.object({
  attempts: z.number(),
  taskStatus: z.enum(['new', 'in-progress', 'completed']),
  incompleteWarnings: z.number(),
  answers: z.record(z.any()),
  duration: z.number(),
  score: z.number().optional(),
  submittedAt: z.number().optional(),
});

export const updateEbookAssignmentSchema = z
  .object({
    assignmentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid assignmentId' }),
    activityId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid activityId' }),
    fieldsToUpdate: ebookFieldsToUpdateSchema,
  })
  .openapi({
    title: 'UpdateEbookAssignment',
    description: 'Schema for update ebook assignments',
  });

export const AssignmentEbookResponseSchema = z
  .object({
    assignedAs: z.enum(['exam', 'exercise']),
    answersRevealed: z.boolean(),
    taskStatus: z.enum(['new', 'in-progress', 'completed']),
    duration: z.number(),
    attempts: z.number(),
    answers: z.record(z.any()),
    incompleteWarnings: z.number(),
  })
  .openapi({
    title: 'AssignmentEbookResponseSchema',
    description: 'Assignment Ebook Response Schema',
  });
//* eBook
