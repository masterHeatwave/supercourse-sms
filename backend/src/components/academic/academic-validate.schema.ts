import { z } from 'zod';

export const academicYearCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    is_manual_active: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.start_date < data.end_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

export const academicYearUpdateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    is_manual_active: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date < data.end_date;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

export const academicYearIdParamSchema = z.object({
  id: z.string().min(1, 'Academic year ID is required'),
});

export const academicPeriodCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    academic_year: z.string().min(1, 'Academic year ID is required'),
  })
  .refine((data) => data.start_date < data.end_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

export const academicPeriodUpdateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    academic_year: z.string().min(1, 'Academic year ID is required').optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date < data.end_date;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

export const academicPeriodIdParamSchema = z.object({
  id: z.string().min(1, 'Academic period ID is required'),
});

// Academic Subperiod schemas
// moved to academic-subperiods-validate.schema.ts
