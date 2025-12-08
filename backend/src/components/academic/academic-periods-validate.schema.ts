import { z } from 'zod';

export const createAcademicPeriodSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    academic_year: z.string().min(1, { message: 'Academic year is required' }),
  })
  .refine(
    (data) => {
      return data.start_date < data.end_date;
    },
    {
      message: 'Start date must be before end date',
      path: ['start_date'],
    }
  );

export const updateAcademicPeriodSchema = z
  .object({
    id: z.string().min(1, { message: 'ID is required' }),
    name: z.string().min(1, { message: 'Name is required' }).optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    academic_year: z.string().min(1, { message: 'Academic year is required' }).optional(),
    is_active: z.boolean().optional(),
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
  );

export const queryAcademicPeriodSchema = z.object({
  academic_year: z.string().optional(),
  current: z.string().optional(),
});
