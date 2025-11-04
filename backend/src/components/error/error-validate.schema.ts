import 'zod-openapi/extend';
import { EnumErrorLocation } from '@components/error/error.interface';
import { z } from 'zod';

export const ErrorItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    message: z.string(),
    location: z.enum(Object.values(EnumErrorLocation) as [string, ...string[]]) as z.ZodType<EnumErrorLocation>,
    status_code: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'ErrorItem',
    description: 'Error item model',
  });

const createSchema = z
  .object({
    title: z.string(),
    message: z.string(),
    location: z.enum(Object.values(EnumErrorLocation) as [string, ...string[]]) as z.ZodType<EnumErrorLocation>,
    status_code: z.number(),
  })
  .openapi({
    title: 'CreateErrorItem',
    description: 'Schema for creating a new error item',
  });

export { createSchema };
