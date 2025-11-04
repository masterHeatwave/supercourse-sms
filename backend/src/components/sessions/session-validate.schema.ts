import 'zod-openapi/extend';
import { z } from 'zod';

// Schemas for populated fields in Session response
const TaxiObjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    branch: z.string(),
    subject: z.string(),
    level: z.string(),
  })
  .openapi({ title: 'PopulatedTaxi', description: 'Details of a populated taxi object' });

const ClassroomObjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
  })
  .openapi({ title: 'PopulatedClassroom', description: 'Details of a populated classroom object' });

const AcademicPeriodObjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi({ title: 'PopulatedAcademicPeriod', description: 'Details of a populated academic period object' });

const AcademicSubperiodObjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi({ title: 'PopulatedAcademicSubperiod', description: 'Details of a populated academic subperiod object' });

export const SessionSchema = z
  .object({
    id: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    taxi: TaxiObjectSchema,
    classroom: ClassroomObjectSchema,
    students: z.array(z.string()).optional(),
    teachers: z.array(z.string()).optional(),
    academic_period: AcademicPeriodObjectSchema,
    academic_subperiod: AcademicSubperiodObjectSchema.optional(),
    is_recurring: z.boolean().optional(),
    room: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
    invite_participants: z.boolean().optional(),
    mode: z.enum(['in_person', 'online', 'hybrid']).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Session',
    description: 'Session response model with populated fields for taxi, classroom, academic period, and subperiod.',
  });

export const createSessionSchema = z
  .object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    taxi: z.string().min(1, { message: 'Taxi is required' }),
    classroom: z.string().min(1, { message: 'Classroom is required' }),
    students: z.array(z.string()).optional(),
    teachers: z.array(z.string()).optional(),
    academic_period: z.string().min(1, { message: 'Academic period is required' }),
    academic_subperiod: z.string().optional(),
    is_recurring: z.boolean().optional(),
    room: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
    invite_participants: z.boolean().optional(),
    mode: z.enum(['in_person', 'online', 'hybrid']).optional(),
    // New recurring session fields
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)')
      .optional(),
    duration: z
      .number()
      .min(0.5, 'Duration must be at least 0.5 hours')
      .max(24, 'Duration cannot exceed 24 hours')
      .optional(),
    frequency: z
      .number()
      .min(1, 'Frequency must be at least 1 week')
      .max(52, 'Frequency cannot exceed 52 weeks')
      .optional(),
  })
  .refine(
    (data) => {
      return data.start_date < data.end_date;
    },
    {
      message: 'Start date must be before end date',
      path: ['start_date'],
    }
  )
  .openapi({
    title: 'CreateSession',
    description: 'Schema for creating a new session',
  });

export const updateSessionSchema = z
  .object({
    id: z.string().min(1, { message: 'ID is required' }),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    taxi: z.string().min(1, { message: 'Taxi is required' }).optional(),
    classroom: z.string().min(1, { message: 'Classroom is required' }).optional(),
    students: z.array(z.string()).optional(),
    teachers: z.array(z.string()).optional(),
    academic_period: z.string().min(1, { message: 'Academic period is required' }).optional(),
    academic_subperiod: z.string().optional(),
    is_recurring: z.boolean().optional(),
    room: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
    invite_participants: z.boolean().optional(),
    mode: z.enum(['in_person', 'online', 'hybrid']).optional(),
    // New recurring session fields
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)')
      .optional(),
    duration: z
      .number()
      .min(0.5, 'Duration must be at least 0.5 hours')
      .max(24, 'Duration cannot exceed 24 hours')
      .optional(),
    frequency: z
      .number()
      .min(1, 'Frequency must be at least 1 week')
      .max(52, 'Frequency cannot exceed 52 weeks')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date < data.end_date;
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['start_date'],
    }
  )
  .openapi({
    title: 'UpdateSession',
    description: 'Schema for updating an existing session',
  });

export const querySessionSchema = z
  .object({
    taxi: z.string().optional(),
    classroom: z.string().optional(),
    academic_period: z.string().optional(),
    academic_subperiod: z.string().optional(),
    teacher: z.string().optional(),
    student: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    is_recurring: z.string().optional(),
    mode: z.enum(['in_person', 'online', 'hybrid']).optional(),
    branch: z.string().optional(),
    // Pagination and selection controls (align with users listing)
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    select: z.string().optional(),
  })
  .openapi({
    title: 'QuerySession',
    description: 'Schema for querying sessions',
  });

export const addStudentSchema = z
  .object({
    session_id: z.string().min(1, { message: 'Session ID is required' }),
    student_id: z.string().min(1, { message: 'Student ID is required' }),
  })
  .openapi({
    title: 'AddStudentToSession',
    description: 'Schema for adding a student to a session',
  });

export const removeStudentSchema = z
  .object({
    session_id: z.string().min(1, { message: 'Session ID is required' }),
    student_id: z.string().min(1, { message: 'Student ID is required' }),
  })
  .openapi({
    title: 'RemoveStudentFromSession',
    description: 'Schema for removing a student from a session',
  });

export const addTeacherSchema = z
  .object({
    session_id: z.string().min(1, { message: 'Session ID is required' }),
    teacher_id: z.string().min(1, { message: 'Teacher ID is required' }),
  })
  .openapi({
    title: 'AddTeacherToSession',
    description: 'Schema for adding a teacher to a session',
  });

export const removeTeacherSchema = z
  .object({
    session_id: z.string().min(1, { message: 'Session ID is required' }),
    teacher_id: z.string().min(1, { message: 'Teacher ID is required' }),
  })
  .openapi({
    title: 'RemoveTeacherFromSession',
    description: 'Schema for removing a teacher from a session',
  });

export const OSTokenSchema = z
  .object({
    id: z.string().min(1, { message: 'User Id is required' }),
    roomName: z.string().min(1, { message: 'Room name is required' }),
    currentRoleTitle: z.string().min(1, { message: 'User role is required' }),
  })
  .openapi({
    title: 'RequestOnlineSessionToken',
    description: 'Schema for requesting a token using for online session',
  });
