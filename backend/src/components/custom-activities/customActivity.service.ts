import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import CustomActivity from './customActivity.model';

export class CustomActivityService {
  async getActivities() {
    const activities = await CustomActivity.find();

    return activities;
  }

  async getActivityById(activityId: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    const activity = await CustomActivity.findById(activityId);

    return activity;
  }

  hasNullOrEmpty(obj: unknown): boolean {
    if (obj === null || obj === undefined) return true;

    if (typeof obj === 'string' && obj.trim() === '') return true;

    if (Array.isArray(obj)) {
      return obj.some((item) => this.hasNullOrEmpty(item));
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (this.hasNullOrEmpty(value)) {
          return true;
        }
      }
    }

    return false;
  }

  async saveActivity(activityObject: any) {
    //const pexelsRegex = /pexels\.com/;
    //const dallERegex = /oaidalleapiprodscus\.blob\.core\.windows\.net/;
    if (!activityObject) {
      throw new ErrorResponse('Wrong data fields.', StatusCodes.BAD_REQUEST);
    }
    /*if (this.hasNullOrEmpty(activityObject)) {
      throw new ErrorResponse('Some fields are null or empty.', StatusCodes.BAD_REQUEST);
    }*/

    const newExercise = await CustomActivity.create(activityObject);

    return newExercise;
  }

  async updateActivity(activityId: string, activityObject: any) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }
    if (!activityObject) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }
    /*if (this.hasNullOrEmpty(activityObject)) {
      throw new ErrorResponse('Some fields are null or empty.', StatusCodes.BAD_REQUEST);
    }*/

    const updatedActivity = await CustomActivity.findByIdAndUpdate(
      activityId,
      { $set: activityObject },
      {
        new: true,
        runValidators: true,
      }
    );

    return updatedActivity;
  }

  async deleteActivityById(activityId: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    const result = await CustomActivity.deleteOne({ _id: activityId });

    if (result.deletedCount === 0) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    return { message: 'Activity successfully deleted.' };
  }

  async getCustomActivitiesByUserID(userId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    const activities = await CustomActivity.find({ userId: userId }).populate('userId');
    return activities;
  }

  async getPublicActivitiesExcludingUserId(userId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    const activities = await CustomActivity.find({
      'settings.public': true,
      userId: { $ne: userId },
    }).populate('userId');

    return activities;
  }

  async duplicateActivityById(activityId: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    const originalActivity = await CustomActivity.findById(activityId);

    if (!originalActivity) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    const activityData = originalActivity.toObject();
    delete activityData._id;

    // Optionally, you can also reset fields like timestamps if needed
    // activityData.createdAt = undefined;
    // activityData.updatedAt = undefined;

    const duplicatedActivity = await CustomActivity.create(activityData);
    //await duplicatedActivity.save();
    const populatedActivity = await duplicatedActivity.populate('userId');

    return populatedActivity;
  }

  async duplicatePublicActivityById(activityId: string, userId: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    const originalActivity = await CustomActivity.findById(activityId);
    if (!originalActivity) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    if (!originalActivity.settings.get('public')) {
      throw new ErrorResponse('Only public activities can be duplicated.', StatusCodes.FORBIDDEN);
    }

    const { _id, userId: originalUserId, ...activityData } = originalActivity.toObject();

    const newActivity = new CustomActivity({
      ...activityData,
      userId: userId,
      //name: `${activityData.name} (Copy)`,
    });

    // Save the new activity
    //const savedActivity = await CustomActivity.create(activityData);
    const savedActivity = await CustomActivity.create(newActivity);
    const populatedActivity = await savedActivity.populate('userId');
    return populatedActivity;
  }

  async getStudentActivities(userId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    console.log('Hey');

    const activities = await CustomActivity.find()
      .populate({
        path: 'userId',
        match: { user_type: 'student' },
      })
      .exec();

    const studentActivities = activities.filter((activity) => activity.user !== null);

    return studentActivities;
  }
}
