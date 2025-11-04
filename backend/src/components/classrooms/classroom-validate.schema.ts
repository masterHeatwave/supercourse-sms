import 'zod-openapi/extend';
import { z } from 'zod';

const availabilitySchema = z.enum(['available', 'unavailable', 'out_of_order', 'under_maintenance']);

export const ClassroomSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    capacity: z.number().positive().optional(),
    location: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    customer: z.string(),
    type: z
      .enum([
        'standard',
        'computer_lab',
        'science_lab',
        'art_studio',
        'music_room',
        'gymnasium',
        'library',
        'conference_room',
      ])
      .optional(),
    description: z.string().optional(),
    availability: availabilitySchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Classroom',
    description: 'Classroom model',
  });

export const createClassroomSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    capacity: z.number().positive().optional(),
    location: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    customer: z.string().min(1, { message: 'Customer ID is required' }),
    type: z
      .enum([
        'standard',
        'computer_lab',
        'science_lab',
        'art_studio',
        'music_room',
        'gymnasium',
        'library',
        'conference_room',
      ])
      .optional(),
    description: z.string().optional(),
    availability: availabilitySchema.optional(),
  })
  .openapi({
    title: 'CreateClassroom',
    description: 'Schema for creating a new classroom',
  });

export const updateClassroomSchema = z
  .object({
    id: z.string().min(1, { message: 'ID is required' }),
    name: z.string().min(1, { message: 'Name is required' }).optional(),
    capacity: z.number().positive().optional(),
    location: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    customer: z.string().optional(),
    type: z
      .enum([
        'standard',
        'computer_lab',
        'science_lab',
        'art_studio',
        'music_room',
        'gymnasium',
        'library',
        'conference_room',
      ])
      .optional(),
    description: z.string().optional(),
    availability: availabilitySchema.optional(),
  })
  .openapi({
    title: 'UpdateClassroom',
    description: 'Schema for updating an existing classroom',
  });

export const queryClassroomSchema = z
  .object({
    search: z.string().optional(),
    location: z.string().optional(),
    equipment: z.string().optional(),
    minCapacity: z.string().optional(),
    available_day: z.string().optional(),
    available_time: z.string().optional(),
    customer: z.union([z.string(), z.array(z.string())]).optional(),
    branch: z.string().optional(),
    // Pagination and selection controls
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    select: z.string().optional(),
  })
  .openapi({
    title: 'QueryClassroom',
    description: 'Schema for querying classrooms',
  });
