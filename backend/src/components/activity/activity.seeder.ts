import { logger } from '@utils/logger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Activity from './activity.model';
import User from '@components/users/user.model';
import Post from '@components/posts/post.model';
import Taxi from '@components/taxi/taxi.model';
import { ActivityActionType, ActivityEntityType } from './activity.interface';
import { markComponentComplete } from '@utils/seedingLogger';
import { IUserType } from '@components/users/user.interface';

const seedTenantActivities = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingActivities = await Activity.countDocuments();
      if (existingActivities > 0) {
        markComponentComplete('activities', tenantId);
        return;
      }

      // Get admin users for the tenant
      const adminUsers = await User.find({ user_type: IUserType.ADMIN }).limit(2);

      if (adminUsers.length === 0) {
        logger.warn(`[${tenantId}] No admin users found, skipping activity seeding.`);
        markComponentComplete('activities', tenantId);
        return;
      }

      const admin = adminUsers[0];

      // Get some students
      const students = await User.find({ user_type: IUserType.STUDENT }).limit(5);

      if (students.length === 0) {
        logger.warn(`[${tenantId}] No students found, skipping activity seeding.`);
        markComponentComplete('activities', tenantId);
        return;
      }

      // Get some taxis
      const taxis = await Taxi.find().limit(3);

      if (taxis.length === 0) {
        logger.warn(`[${tenantId}] No taxis found, skipping activity seeding.`);
        markComponentComplete('activities', tenantId);
        return;
      }

      // Get some posts
      const posts = await Post.find().limit(3);

      // Create activity records
      const activities = [
        // User creation activities
        ...students.map((student) => ({
          action_type: ActivityActionType.CREATE,
          entity_type: ActivityEntityType.STUDENT,
          entity_id: student.id,
          entity_name: `${student.firstname} ${student.lastname}`,
          performed_by: admin._id,
          details: 'New student created',
        })),

        // Taxi activities
        ...taxis.map((taxi) => ({
          action_type: ActivityActionType.CREATE,
          entity_type: ActivityEntityType.TAXI,
          entity_id: taxi._id.toString(),
          entity_name: taxi.name,
          performed_by: admin._id,
          details: `Created new taxi: ${taxi.name}`,
        })),
      ];

      // Add post activities if posts exist
      if (posts.length > 0) {
        activities.push(
          ...posts.map((post) => ({
            action_type: ActivityActionType.CREATE,
            entity_type: ActivityEntityType.POST,
            entity_id: post.id,
            entity_name: post.title,
            performed_by: admin._id,
            details: `Created new post: ${post.title}`,
          }))
        );
      }

      // Add some update activities
      if (students.length > 0) {
        activities.push({
          action_type: ActivityActionType.UPDATE,
          entity_type: ActivityEntityType.STUDENT,
          entity_id: students[0].id,
          entity_name: `${students[0].firstname} ${students[0].lastname}`,
          performed_by: admin._id,
          details: 'Updated student information',
        });
      }

      if (taxis.length > 0) {
        activities.push({
          action_type: ActivityActionType.UPDATE,
          entity_type: ActivityEntityType.TAXI,
          entity_id: taxis[0].id,
          entity_name: taxis[0].name,
          performed_by: admin._id,
          details: 'Updated taxi information',
        });
      }

      // Execute creation of activities
      await Activity.create(activities);

      logger.info(`[${tenantId}] Seeded ${activities.length} activity records successfully`);
      markComponentComplete('activities', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding activities:`, error);
      throw error;
    }
  });
};

const seedActivities = async () => {
  await seedTenantActivities('supercourse');
};

export default seedActivities;
