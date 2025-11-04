import mongoose from 'mongoose';
import { config } from '@config/config';
import { ActivityService } from './activity.service';
import { ActivityActionType, ActivityEntityType } from './activity.interface';
import Activity from './activity.model';

/**
 * Simple test script to verify that activity tracking works
 * Run with: ts-node src/components/activity/test-activity.ts
 */
const runTest = async () => {
  try {
    // Connect to the database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to MongoDB');

    const activityService = new ActivityService();

    // Create a test activity directly through the service
    console.log('Creating a test activity...');
    const testActivity = await activityService.createActivity({
      action_type: ActivityActionType.CREATE,
      entity_type: ActivityEntityType.USER,
      entity_id: new mongoose.Types.ObjectId().toString(),
      entity_name: 'Test User',
      performed_by: new mongoose.Types.ObjectId().toString(),
      details: 'Test activity created for verification',
    });
    console.log('Test activity created:', testActivity);

    // Query activities
    console.log('Querying recent activities...');
    const recentActivities = await activityService.getRecentActivities(5);
    console.log(`Found ${recentActivities.length} recent activities`);

    // Query test activity
    console.log('Querying dashboard activities...');
    const dashboardActivities = await activityService.getDashboardActivities(5);
    console.log(`Found ${dashboardActivities.length} dashboard activities`);

    // Clean up - delete the test activity
    console.log('Cleaning up...');
    await Activity.findByIdAndDelete(testActivity._id);
    console.log('Test activity deleted');

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

runTest();
