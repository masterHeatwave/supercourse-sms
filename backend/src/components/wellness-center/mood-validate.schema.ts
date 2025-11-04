import 'zod-openapi/extend';
import { z } from 'zod';

//const availabilitySchema = z.enum(['available', 'unavailable', 'out_of_order', 'under_maintenance']);

export const MoodSchema = z
  .object({
    userId: z.string(),
    taxisId: z.string(),
    academic_subperiod: z.string(),
    mood: z.string(),
    date: z.string(),
  })
  .openapi({
    title: 'Mood',
    description: 'Mood model',
  });

export const MoodVideoSchema = z
  .object({
    source: z.string(),
    title: z.string(),
    type: z.string(),
    viewCount: z.number(),
  })
  .openapi({
    title: 'Mood video',
    description: 'Mood video model',
  });

export const createMoodSchema = z
  .object({
    userId: z.string(),
    taxisId: z.string(),
    academic_subperiod: z.string(),
    mood: z.string(),
    date: z.string(),
  })
  .openapi({
    title: 'CreateMood',
    description: 'Schema for creating a new mood',
  });

export const registerMoodVideoSchema = z
  .object({
    source: z.string(),
    title: z.string(),
    type: z.string(),
    viewCount: z.number(),
  })
  .openapi({
    title: 'Mood video',
    description: 'Schema for registering a video view',
  });
