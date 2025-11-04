import 'zod-openapi/extend';
import { z } from 'zod';
import { ActivityActionType, ActivityEntityType } from './activity.interface';

export const ActivitySchema = z
  .object({
    id: z.string(),
    action_type: z.enum([ActivityActionType.CREATE, ActivityActionType.UPDATE, ActivityActionType.DELETE]),
    entity_type: z.enum([
      ActivityEntityType.USER,
      ActivityEntityType.STUDENT,
      ActivityEntityType.TAXI,
      ActivityEntityType.POST,
      ActivityEntityType.SESSION,
      ActivityEntityType.CLASSROOM,
      ActivityEntityType.ABSENCE,
    ]),
    entity_id: z.string(),
    entity_name: z.string(),
    performed_by: z.string(),
    details: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Activity',
    description: 'Activity model',
  });

export const createActivitySchema = z
  .object({
    action_type: z.enum([ActivityActionType.CREATE, ActivityActionType.UPDATE, ActivityActionType.DELETE]),
    entity_type: z.enum([
      ActivityEntityType.USER,
      ActivityEntityType.STUDENT,
      ActivityEntityType.TAXI,
      ActivityEntityType.POST,
      ActivityEntityType.SESSION,
      ActivityEntityType.CLASSROOM,
      ActivityEntityType.ABSENCE,
    ]),
    entity_id: z.string().min(1, { message: 'Entity ID is required' }),
    entity_name: z.string().min(1, { message: 'Entity name is required' }),
    performed_by: z.string().min(1, { message: 'User ID who performed the action is required' }),
    details: z.string().optional(),
  })
  .openapi({
    title: 'CreateActivity',
    description: 'Schema for creating a new activity record',
  });

export const queryActivitySchema = z
  .object({
    action_type: z.enum([ActivityActionType.CREATE, ActivityActionType.UPDATE, ActivityActionType.DELETE]).optional(),
    entity_type: z
      .enum([
        ActivityEntityType.USER,
        ActivityEntityType.STUDENT,
        ActivityEntityType.TAXI,
        ActivityEntityType.POST,
        ActivityEntityType.SESSION,
        ActivityEntityType.CLASSROOM,
        ActivityEntityType.ABSENCE,
      ])
      .optional(),
    entity_id: z.string().optional(),
    performed_by: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    limit: z.number().optional(),
  })
  .openapi({
    title: 'QueryActivity',
    description: 'Schema for querying activity records',
  });
