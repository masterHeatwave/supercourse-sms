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

export const queryAssignmentForStudentSchema = z
  .object({
    schoolID: z.string().optional(),
    branchID: z.string().optional(),
    staffID: z.string().optional(),
    staffAssignmentID: z.string().optional(),
    classID: z.string().optional(),
    studentID: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    academicYear: z.string().optional(),
    academicPeriod: z.string().optional(),
    academicTerm: z.string().optional(),
    assignmentStatus: z.enum(['new', 'in-progress', 'completed']).optional(),
    taskStatus: z.enum(['new', 'in-progress', 'completed']).optional(),
    isDeletedForMe: z.string().optional(),
    isDeletedForEveryone: z.string().optional(),
    isPermanentlyDeleted: z.string().optional(),
    status: z.enum(['active', 'upcoming', 'past']).optional(),
  })
  .openapi({
    title: 'QueryAssignmentForStudent',
    description: 'Schema for querying assignments for students',
  });
