import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import CustomActivity, { AssignedCustomActivity } from './customActivity.model';
import mongoose, { omitUndefined, Types } from 'mongoose';
import { AssignmentForStudent } from '@components/assignments/assignment-student.model';

export class CustomActivityService {
  async getActivities() {
    const activities = await CustomActivity.find();

    if (!activities || activities.length < 1) {
      throw new ErrorResponse('No activities found.', StatusCodes.NOT_FOUND);
    }

    return activities;
  }

  async getActivityById(activityId: string) {
    if (!activityId || !mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    const activity = await CustomActivity.findById(activityId);

    if (!activity) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    return activity;
  }

  async getSinglePlayerActivitiesByUserIdTag(userId: string, tag: string) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('User ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const activities = await CustomActivity.find({
      userId,
      tags: { $in: [tag] },
      playerMode: 'singlePlayer',
    });

    if (!activities || activities.length < 1) {
      throw new ErrorResponse('No activities found.', StatusCodes.NOT_FOUND);
    }

    return activities;
  }

  async saveActivity(activityObject: any) {
    //const pexelsRegex = /pexels\.com/;
    //const dallERegex = /oaidalleapiprodscus\.blob\.core\.windows\.net/;
    if (!activityObject) {
      throw new ErrorResponse('Wrong data fields.', StatusCodes.BAD_REQUEST);
    }

    const newExercise = await CustomActivity.create(activityObject);

    if (!newExercise) {
      throw new ErrorResponse('Error on activity creation.', StatusCodes.CONFLICT);
    }

    return newExercise;
  }

  async updateActivity(activityId: string, activityObject: any) {
    if (!activityId || !mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!activityObject) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    const updatedActivity = await CustomActivity.findByIdAndUpdate(
      activityId,
      { $set: activityObject },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedActivity) {
      throw new ErrorResponse('No activities found.', StatusCodes.NOT_FOUND);
    }

    return updatedActivity;
  }

  async deleteActivityById(activityId: string) {
    if (!activityId || !mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    const result = await CustomActivity.deleteOne({ _id: activityId });

    if (result.deletedCount === 0) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    return { message: 'Activity successfully deleted.' };
  }

  async getCustomActivitiesByUserID(userId: string) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    const activities = await CustomActivity.find({ userId: userId }).populate('userId');

    if (!activities || activities.length < 1) {
      throw new ErrorResponse('No activities found.', StatusCodes.NOT_FOUND);
    }

    return activities;
  }

  async getPublicActivitiesExcludingUserId(userId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('User ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const activities = await CustomActivity.find({
      'settings.public': true,
      userId: { $ne: userId },
    }).populate('userId');

    if (!activities || activities.length < 1) {
      throw new ErrorResponse('No public activities found.', StatusCodes.NOT_FOUND);
    }

    return activities;
  }

  async duplicateActivityById(activityId: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const originalActivity = await CustomActivity.findById(activityId);

    if (!originalActivity) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    const activityData = originalActivity.toObject();
    delete activityData._id;

    const duplicatedActivity = await CustomActivity.create(activityData);

    if (!duplicatedActivity) {
      throw new ErrorResponse('Error on activity creation.', StatusCodes.NOT_FOUND);
    }

    const populatedActivity = await duplicatedActivity.populate('userId');

    return populatedActivity;
  }

  async duplicatePublicActivityById(activityId: string, userId: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('User ID is not valid.', StatusCodes.BAD_REQUEST);
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
    });

    const savedActivity = await CustomActivity.create(newActivity);

    if (!savedActivity) {
      throw new ErrorResponse('Error on activity creation.', StatusCodes.NOT_FOUND);
    }

    const populatedActivity = await savedActivity.populate('userId');
    return populatedActivity;
  }

  async getStudentActivities(userId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('User ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const activities = await AssignedCustomActivity.find({
      'students.studentId': userId,
      //'students.completed': true,
    })
      .populate('classId')
      .populate('userId');

    return activities;
  }

  async getStudentActivity(userId: string, activityId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorResponse('User ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const activity = await AssignedCustomActivity.findOne({
      _id: activityId,
      students: {
        $elemMatch: {
          studentId: new mongoose.Types.ObjectId(userId),
          //completed: true,
        },
      },
    }).populate('classId');

    return activity;
  }

  async getAssignedActivities() {
    const activities = await AssignedCustomActivity.find().populate('classId').populate('userId');

    if (!activities || activities.length < 1) {
      throw new ErrorResponse('No activities found.', StatusCodes.NOT_FOUND);
    }

    return activities;
  }

  async createAssignedActivity(activityId: string, students: [], classId: string, assignmentBundle: string) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!classId) {
      throw new ErrorResponse('Wrong class or class missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new ErrorResponse('Class ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const originalActivity = await CustomActivity.findById(activityId);

    if (!originalActivity) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    const activityData = originalActivity.toObject();
    activityData.originalActivity = activityId;
    delete activityData._id;

    const newAssignedActivityData = {
      ...activityData,
      students: students.map((studentId) => ({
        studentId,
        completed: false,
      })),
      classId: classId,
      assignmentBundle: assignmentBundle,
    };

    const assignedActivity = await AssignedCustomActivity.create(newAssignedActivityData);

    if (!assignedActivity) {
      throw new ErrorResponse('Error on activity creation.', StatusCodes.NOT_FOUND);
    }

    return assignedActivity;
  }

  async updateAssignedActivityStatus(activityId: string, studentId: string, status: boolean) {
    if (!activityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!studentId) {
      throw new ErrorResponse('Wrong class or class missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ErrorResponse('Class ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (typeof status !== 'boolean') {
      throw new ErrorResponse('Status must be a boolean', StatusCodes.BAD_REQUEST);
    }

    const assignedActivity = await AssignedCustomActivity.updateOne(
      { _id: activityId, 'students.studentId': studentId },
      { $set: { 'students.$.completed': status } }
    );

    if (assignedActivity.modifiedCount === 0) {
      throw new ErrorResponse('Student not found in activity.', StatusCodes.NOT_FOUND);
    }

    return assignedActivity;
  }

  async addStudentsToAssignedActivity(assignedActivityId: string, studentIds: string[]) {
    if (!mongoose.Types.ObjectId.isValid(assignedActivityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const formattedStudents = studentIds.map((id) => ({
      studentId: id,
      completed: false,
    }));

    const updated = await AssignedCustomActivity.findByIdAndUpdate(
      assignedActivityId,
      {
        $addToSet: {
          students: { $each: formattedStudents },
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new ErrorResponse('Assigned activity not found.', StatusCodes.NOT_FOUND);
    }

    return updated;
  }

  async removeStudentsFromAssignedActivity(assignedActivityId: string, studentIds: string[]) {
    if (!mongoose.Types.ObjectId.isValid(assignedActivityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const updated = await AssignedCustomActivity.findByIdAndUpdate(
      assignedActivityId,
      {
        $pull: {
          students: {
            studentId: { $in: studentIds },
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new ErrorResponse('Assigned activity not found.', StatusCodes.NOT_FOUND);
    }

    return updated;
  }

  async updateAssignedTaskAnswers(assignmentId: string, studentId: string, customActivityId: string, answers: any) {
    if (!assignmentId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!studentId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!customActivityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(customActivityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const assignment = await AssignmentForStudent.findOne({
      _id: new Types.ObjectId(assignmentId),
      studentID: new Types.ObjectId(studentId),
    });

    if (!assignment) {
      throw new ErrorResponse('Assignment not found for this student.', StatusCodes.NOT_FOUND);
    }

    const task = assignment.tasks?.find(
      (t) => t.customActivityID && t.customActivityID.toString() === customActivityId
    );

    if (!task) {
      throw new ErrorResponse('Task with the given customActivityID not found.', StatusCodes.NOT_FOUND);
    }

    task.attempts = answers.attempts;
    task.duration = answers.duration;
    task.score = answers.score;
    task.answers = answers.answers;
    //task.answers.activityType = answers.answers.activityType;
    //task.answers.data = answers.answers.data;
    task.taskStatus = 'completed';

    await assignment.save();

    return assignment;
  }

  async updateActivityPlays(customActivityId: string, duration: number) {
    if (!customActivityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(customActivityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (typeof duration !== 'number') {
      throw new ErrorResponse('Duration is required', StatusCodes.BAD_REQUEST);
    }

    const updated = await CustomActivity.findByIdAndUpdate(
      customActivityId,
      { $inc: { plays: 1, totalDuration: duration } },
      { new: true }
    );

    if (!updated) {
      throw new ErrorResponse('Activity not found.', StatusCodes.NOT_FOUND);
    }

    return updated;
  }

  async getAssignedTaskAnswers(assignmentId: string, studentId: string, customActivityId: string) {
    if (!assignmentId) {
      throw new ErrorResponse('Wrong assignment or assignment missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ErrorResponse('Assignment ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!studentId) {
      throw new ErrorResponse('Wrong student or student missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ErrorResponse('Student ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    if (!customActivityId) {
      throw new ErrorResponse('Wrong activity or activity missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(customActivityId)) {
      throw new ErrorResponse('Activity ID is not valid.', StatusCodes.BAD_REQUEST);
    }

    const assignment = await AssignmentForStudent.findOne({
      _id: new Types.ObjectId(assignmentId),
      studentID: new Types.ObjectId(studentId),
    });

    if (!assignment) {
      throw new ErrorResponse('Assignment not found for this student.', StatusCodes.NOT_FOUND);
    }

    const task = assignment.tasks?.find(
      (t) => t.customActivityID && t.customActivityID.toString() === customActivityId
    );

    if (!task) {
      throw new ErrorResponse('Task with given customActivityID not found.', StatusCodes.NOT_FOUND);
    }

    return {
      answers: task.answers ?? null,
      attempts: task.attempts,
      duration: task.duration,
      score: task.score,
    };
  }
}
