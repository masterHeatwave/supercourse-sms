import 'zod-openapi/extend';
import { z } from 'zod';

// Define sub-schemas for nested objects
const UserSchema = z.object({
  id: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  user_type: z.string().optional(),
  code: z.string().optional(),
  birthday: z.string().optional(),
});

const SessionStatsSchema = z.object({
  sessionsPerWeek: z.number(),
  totalDurationMinutes: z.number(),
  totalDurationFormatted: z.string(),
  days: z.array(z.string()),
  daysFormatted: z.string(),
});

const AcademicYearSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number().optional(),
});

const AcademicPeriodSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const SessionSchema = z.object({
  id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  classroom: z
    .object({
      id: z.string(),
      name: z.string(),
      location: z.string().optional(),
    })
    .optional(),
  teachers: z.array(UserSchema).optional(),
  students: z.array(UserSchema).optional(),
});

export const TaxiSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional(),
    branch: z.string().optional(),
    subject: z.string().optional(),
    level: z.string().optional(),
    academic_year: z.union([z.string(), AcademicYearSchema]).optional(),
    academic_period: z.union([z.string(), AcademicPeriodSchema]).optional(),
    academic_subperiods: z.array(z.string()).optional(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
    users: z.array(z.union([z.string(), UserSchema])).optional(),
    scap_products: z.array(z.string()).optional(),
    sessions: z.array(SessionSchema).optional(),
    sessionStats: SessionStatsSchema.optional(),
    teachers: z.array(UserSchema).optional(),
    students: z.array(UserSchema).optional(),
    teacherCount: z.number().optional(),
    studentCount: z.number().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Taxi',
    description: 'Taxi model with populated session statistics and user data',
  });

export const createTaxiSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    color: z.string().optional(),
    branch: z.string().optional(),
    subject: z.string().optional(),
    level: z.string().optional(),
    academic_year: z.string().min(1, { message: 'Academic year is required' }),
    academic_period: z.string().min(1, { message: 'Academic period is required' }),
    academic_subperiods: z.array(z.string()).optional(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
    users: z.array(z.string()).optional(),
    scap_products: z.array(z.string()).optional(),
  })
  .openapi({
    title: 'CreateTaxi',
    description: 'Schema for creating a new taxi',
  });

export const updateTaxiSchema = z
  .object({
    id: z.string().min(1, { message: 'ID is required' }),
    name: z.string().min(1, { message: 'Name is required' }).optional(),
    color: z.string().optional(),
    branch: z.string().optional(),
    subject: z.string().optional(),
    level: z.string().optional(),
    academic_year: z.string().min(1, { message: 'Academic year is required' }).optional(),
    academic_period: z.string().min(1, { message: 'Academic period is required' }).optional(),
    academic_subperiods: z.array(z.string()).optional(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
    users: z.array(z.string()).optional(),
    scap_products: z.array(z.string()).optional(),
  })
  .openapi({
    title: 'UpdateTaxi',
    description: 'Schema for updating an existing taxi',
  });

export const queryTaxiSchema = z
  .object({
    academic_year: z.string().optional(),
    academic_period: z.string().optional(),
    branch: z.string().optional(),
    subject: z.string().optional(),
    level: z.string().optional(),
    search: z.string().optional(),
  })
  .openapi({
    title: 'QueryTaxi',
    description: 'Schema for querying taxis',
  });

export const addUserSchema = z
  .object({
    taxi_id: z.string().min(1, { message: 'Taxi ID is required' }),
    user_id: z.string().min(1, { message: 'User ID is required' }),
  })
  .openapi({
    title: 'AddUserToTaxi',
    description: 'Schema for adding a user to a taxi',
  });

export const removeUserSchema = z
  .object({
    taxi_id: z.string().min(1, { message: 'Taxi ID is required' }),
    user_id: z.string().min(1, { message: 'User ID is required' }),
  })
  .openapi({
    title: 'RemoveUserFromTaxi',
    description: 'Schema for removing a user from a taxi',
  });

// Attendance schemas
export const TaxiAttendanceRowSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  })
  .and(z.record(z.string(), z.boolean()))
  .openapi({
    title: 'TaxiAttendanceRow',
    description: 'Attendance row per student; dynamic date keys map to boolean (true=present, false=absent).',
  });

export const TaxiAttendanceSchema = z
  .object({
    rows: z.array(TaxiAttendanceRowSchema),
    dates: z.array(z.string()),
    taxi: z.object({ id: z.string(), name: z.string() }),
  })
  .openapi({
    title: 'TaxiAttendance',
    description: 'Aggregated attendance response for a taxi/class',
  });
