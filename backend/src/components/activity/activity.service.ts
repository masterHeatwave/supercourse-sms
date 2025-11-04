import { ErrorResponse } from '@utils/errorResponse';
import Activity from './activity.model';
import { IActivity, IActivityCreateDTO, IActivityQueryDTO, ActivityEntityType } from './activity.interface';

export class ActivityService {
  async getAllActivities(queryParams: IActivityQueryDTO): Promise<IActivity[]> {
    const query: any = {};

    if (queryParams.action_type) {
      query.action_type = queryParams.action_type;
    }

    if (queryParams.entity_type) {
      query.entity_type = queryParams.entity_type;
    }

    if (queryParams.entity_id) {
      query.entity_id = queryParams.entity_id;
    }

    if (queryParams.performed_by) {
      query.performed_by = queryParams.performed_by;
    }

    if (queryParams.from_date && queryParams.to_date) {
      query.createdAt = {
        $gte: new Date(queryParams.from_date),
        $lte: new Date(queryParams.to_date),
      };
    } else if (queryParams.from_date) {
      query.createdAt = { $gte: new Date(queryParams.from_date) };
    } else if (queryParams.to_date) {
      query.createdAt = { $lte: new Date(queryParams.to_date) };
    }

    const limit = queryParams.limit || 50;

    const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(limit).populate({
      path: 'performed_by',
      select: 'firstname lastname user_type',
    });

    return activities;
  }

  async getActivityById(id: string): Promise<IActivity> {
    const activity = await Activity.findById(id).populate({
      path: 'performed_by',
      select: 'firstname lastname user_type',
    });

    if (!activity) {
      throw new ErrorResponse(`Activity not found with id of ${id}`, 404);
    }

    return activity;
  }

  async createActivity(activityData: IActivityCreateDTO): Promise<IActivity> {
    const activity = await Activity.create(activityData);
    return activity;
  }

  async getRecentActivities(limit = 10): Promise<IActivity[]> {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(limit).populate({
      path: 'performed_by',
      select: 'firstname lastname user_type',
    });

    return activities;
  }

  async getActivitiesByEntityId(entityId: string, entityType?: ActivityEntityType): Promise<IActivity[]> {
    const query: any = { entity_id: entityId };

    if (entityType) {
      query.entity_type = entityType;
    }

    const activities = await Activity.find(query).sort({ createdAt: -1 }).populate({
      path: 'performed_by',
      select: 'firstname lastname user_type',
    });

    return activities;
  }

  async getActivitiesByUser(userId: string, limit = 10): Promise<IActivity[]> {
    const activities = await Activity.find({ performed_by: userId }).sort({ createdAt: -1 }).limit(limit).populate({
      path: 'performed_by',
      select: 'firstname lastname user_type',
    });

    return activities;
  }

  async getDashboardActivities(limit = 10): Promise<IActivity[]> {
    // Get recent activities across all entity types
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(limit).populate({
      path: 'performed_by',
      select: 'firstname lastname user_type avatar',
    });

    return activities;
  }

  // Helper method to record activity
  async recordActivity(
    userId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    entityName: string,
    details?: string
  ): Promise<IActivity> {
    return await Activity.create({
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      performed_by: userId,
      details,
    });
  }
}
