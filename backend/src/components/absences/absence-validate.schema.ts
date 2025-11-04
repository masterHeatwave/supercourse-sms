import { z } from 'zod';
import 'zod-openapi/extend';
import { AbsenceStatus } from './absence.interface';

export const AbsenceSchema = z
  .object({
    _id: z.string(),
    session: z.string().or(
      z.object({
        _id: z.string(),
        start_date: z.string().or(z.date()),
        end_date: z.string().or(z.date()),
      })
    ),
    student: z.string().or(
      z.object({
        _id: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email().optional(),
      })
    ),
    date: z.string().or(z.date()),
    reason: z.string().optional(),
    status: z.enum([AbsenceStatus.UNEXCUSED, AbsenceStatus.EXCUSED, AbsenceStatus.JUSTIFIED]),
    justification_document: z.string().optional(),
    taxi: z.string().or(
      z.object({
        _id: z.string(),
        name: z.string(),
        color: z.string().optional(),
      })
    ),
    academic_period: z.string().or(
      z.object({
        _id: z.string(),
        name: z.string(),
      })
    ),
    note: z.string().optional(),
    notified_parent: z.boolean(),
    notification_date: z.string().or(z.date()).optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .openapi({
    title: 'Absence',
    description: 'Absence model',
  });

export const absenceCreateSchema = z
  .object({
    session: z.string().min(1, { message: 'Session is required' }),
    student: z.string().min(1, { message: 'Student is required' }),
    date: z.string().or(z.date()),
    reason: z.string().optional(),
    status: z.enum([AbsenceStatus.UNEXCUSED, AbsenceStatus.EXCUSED, AbsenceStatus.JUSTIFIED]).optional(),
    justification_document: z.string().optional(),
    taxi: z.string().min(1, { message: 'Taxi is required' }),
    academic_period: z.string().min(1, { message: 'Academic period is required' }),
    note: z.string().optional(),
    notified_parent: z.boolean().optional(),
    notification_date: z.string().or(z.date()).optional(),
  })
  .openapi({
    title: 'CreateAbsence',
    description: 'Schema for creating a new absence',
  });

export const absenceUpdateSchema = z
  .object({
    session: z.string().optional(),
    student: z.string().optional(),
    date: z.string().or(z.date()).optional(),
    reason: z.string().optional(),
    status: z.enum([AbsenceStatus.UNEXCUSED, AbsenceStatus.EXCUSED, AbsenceStatus.JUSTIFIED]).optional(),
    justification_document: z.string().optional(),
    taxi: z.string().optional(),
    academic_period: z.string().optional(),
    note: z.string().optional(),
    notified_parent: z.boolean().optional(),
    notification_date: z.string().or(z.date()).optional(),
  })
  .openapi({
    title: 'UpdateAbsence',
    description: 'Schema for updating an absence',
  });

export const absenceReportSchema = z
  .object({
    start_date: z.string().or(z.date()).optional(),
    end_date: z.string().or(z.date()).optional(),
    student_id: z.string().optional(),
    taxi_id: z.string().optional(),
    academic_period_id: z.string().optional(),
    status: z.enum([AbsenceStatus.UNEXCUSED, AbsenceStatus.EXCUSED, AbsenceStatus.JUSTIFIED]).optional(),
  })
  .openapi({
    title: 'AbsenceReport',
    description: 'Schema for generating absence reports',
  });

export const AbsenceReportResponseSchema = z
  .object({
    total_absences: z.number(),
    unexcused_count: z.number(),
    excused_count: z.number(),
    justified_count: z.number(),
    students_with_absences: z.number(),
    absences_by_date: z.array(
      z.object({
        date: z.string(),
        count: z.number(),
      })
    ),
    absences_by_taxi: z.array(
      z.object({
        taxi_id: z.string(),
        taxi_name: z.string(),
        count: z.number(),
      })
    ),
    absences_by_student: z.array(
      z.object({
        student_id: z.string(),
        student_name: z.string(),
        count: z.number(),
      })
    ),
  })
  .openapi({
    title: 'AbsenceReportResponse',
    description: 'Response schema for absence reports',
  });

export const NotifyParentResponseSchema = z
  .object({
    _id: z.string(),
    student: z.object({
      _id: z.string(),
      firstname: z.string(),
      lastname: z.string(),
    }),
    notified_parent: z.boolean(),
    notification_date: z.string().or(z.date()),
    notification_method: z.string(),
    notification_status: z.string(),
  })
  .openapi({
    title: 'NotifyParentResponse',
    description: 'Response schema for parent notification',
  });
