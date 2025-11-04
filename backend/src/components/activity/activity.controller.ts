import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { ActivityService } from './activity.service';
import { createActivitySchema, queryActivitySchema } from './activity-validate.schema';
import { IActivityCreateDTO } from './activity.interface';

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  getAllActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryActivitySchema.parse(req.query);
    const activities = await this.activityService.getAllActivities(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: activities.length,
      data: activities,
    });
  });

  getActivityById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const activity = await this.activityService.getActivityById(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: activity,
    });
  });

  createActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const activityData: IActivityCreateDTO = createActivitySchema.parse(req.body);
    const activity = await this.activityService.createActivity(activityData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: activity,
    });
  });

  getRecentActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const activities = await this.activityService.getRecentActivities(limit);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: activities.length,
      data: activities,
    });
  });

  getActivitiesByEntityId = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { entityId, entityType } = req.params;
    const activities = await this.activityService.getActivitiesByEntityId(entityId, entityType as any);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: activities.length,
      data: activities,
    });
  });

  getActivitiesByUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const activities = await this.activityService.getActivitiesByUser(userId, limit);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: activities.length,
      data: activities,
    });
  });

  getDashboardActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const activities = await this.activityService.getDashboardActivities(limit);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: activities.length,
      data: activities,
    });
  });
}
