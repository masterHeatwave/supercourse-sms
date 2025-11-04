import { Schema, HydratedDocument } from 'mongoose';
import { ActivityService } from '@components/activity/activity.service';
import { ActivityActionType, ActivityEntityType } from '@components/activity/activity.interface';
import { logger } from '@utils/logger';

export function activityTrackerPlugin(
  schema: Schema,
  options: {
    entityType: ActivityEntityType;
    entityNameField?: string;
    includeFields?: string[];
    getActivityDetails?: (doc: any, isNew: boolean) => string;
  }
) {
  const entityType = options.entityType;
  const entityNameField = options.entityNameField || 'name';
  const getActivityDetails = options.getActivityDetails;

  schema.post('save', async function (this: HydratedDocument<any>, doc: any) {
    try {
      const activityService = new ActivityService();
      const isNewEntity = this.isNew;

      const userId = doc.author || doc.get('createdBy') || doc.get('modifiedBy') || doc._id;

      const actionType = isNewEntity ? ActivityActionType.CREATE : ActivityActionType.UPDATE;

      const entityName = doc[entityNameField] || `${entityType} ${doc._id}`;

      let details = '';
      if (getActivityDetails) {
        details = getActivityDetails(doc, isNewEntity);
      } else {
        details = isNewEntity ? `Created new ${entityType}: ${entityName}` : `Updated ${entityType}: ${entityName}`;
      }

      await activityService.createActivity({
        action_type: actionType,
        entity_type: entityType,
        entity_id: doc.id,
        entity_name: entityName,
        performed_by: userId.toString(),
        details,
      });
    } catch (error) {
      logger.error(`Error recording ${entityType} activity:`, error);
    }
  });

  schema.post('findOneAndUpdate', async function (doc) {
    if (!doc) return;

    try {
      const activityService = new ActivityService();
      const userId = doc.get('modifiedBy') || doc.get('createdBy') || doc.author || doc._id;
      const entityName = doc[entityNameField] || `${entityType} ${doc._id}`;

      // Get activity details
      let details = '';
      if (getActivityDetails) {
        details = getActivityDetails(doc, false);
      } else {
        details = `Updated ${entityType}: ${entityName}`;
      }

      await activityService.createActivity({
        action_type: ActivityActionType.UPDATE,
        entity_type: entityType,
        entity_id: doc._id.toString(),
        entity_name: entityName,
        performed_by: userId.toString(),
        details,
      });
    } catch (error) {
      logger.error(`Error recording ${entityType} update activity:`, error);
    }
  });

  schema.post('findOneAndDelete', async function (doc) {
    if (!doc) return;

    try {
      const activityService = new ActivityService();
      const userId = doc.get('modifiedBy') || doc.get('createdBy') || doc.author || doc._id;
      const entityName = doc[entityNameField] || `${entityType} ${doc._id}`;

      await activityService.createActivity({
        action_type: ActivityActionType.DELETE,
        entity_type: entityType,
        entity_id: doc._id.toString(),
        entity_name: entityName,
        performed_by: userId.toString(),
        details: `Deleted ${entityType}: ${entityName}`,
      });
    } catch (error) {
      logger.error(`Error recording ${entityType} deletion activity:`, error);
    }
  });
}
