import { AssignmentForStudent } from '@components/assignments/assignment-student.model';

//* eBook
import {
  IAssignmentForStudent,
  IAssignmentTaskFieldsToUpdate,
} from '@components/assignments/assignment-student.interface';
import mongoose from 'mongoose';
//* eBook

export class AssignmentStudentService {
  //****************************************************************************
  //* Controller method for: GET ALL ASSIGNMENTS ✅
  //* Route: GET /assignments/student
  //****************************************************************************

  async getAllAssignments(
    filters: {
      branchID: string;
      studentID: string;
      academicYearID?: string;
      academicPeriodID?: string;
      academicSubperiodID?: string;
      isDeletedForMe?: boolean;
      isDeletedForEveryone?: boolean;
    } = {} as any,
    projection: {},
    options: {}
  ): Promise<IAssignmentForStudent[]> {
    const {
      branchID,
      studentID,
      academicYearID,
      academicPeriodID,
      academicSubperiodID,
      isDeletedForMe,
      isDeletedForEveryone,
    } = filters;
    let filter: any = {};

    filter.branchID = branchID;
    filter.studentID = studentID;

    filter['academicTimeframe.academicYear'] = academicYearID;
    if (academicPeriodID) {
      filter['academicTimeframe.academicPeriod'] = academicPeriodID;
    }
    if (academicSubperiodID) {
      filter['academicTimeframe.academicTerm'] = academicSubperiodID;
    }

    if (typeof isDeletedForMe === 'boolean') {
      filter.isDeletedForMe = isDeletedForMe;
    } else {
      filter.isDeletedForMe = false;
    }
    if (typeof isDeletedForEveryone === 'boolean') {
      filter.isDeletedForEveryone = isDeletedForEveryone;
    } else {
      filter.isDeletedForEveryone = false;
    }

    try {
      const assignments = await AssignmentForStudent.find(filter, projection, options)
        .populate({ path: 'schoolID', select: ['name'] })
        .populate({ path: 'branchID', select: ['name'] })
        .populate({ path: 'staffID', select: ['firstname', 'lastname'] })
        .populate({ path: 'classID', select: ['name', 'subject', 'level', 'cefr'] })
        .populate({ path: 'studentID', select: ['firstname', 'lastname', 'avatar'] })
        .populate({ path: 'academicTimeframe.academicYear', select: ['name', 'start_date', 'end_date'] })
        .populate({ path: 'academicTimeframe.academicPeriod', select: ['name', 'start_date', 'end_date'] })
        .populate({ path: 'academicTimeframe.academicTerm', select: ['name', 'start_date', 'end_date'] });

      return assignments;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: CREATE ASSIGNMENT ✅
  //* Route: POST /assignments/student
  //****************************************************************************

  async createAssignment(data: IAssignmentForStudent, staffAssignmentID: string): Promise<IAssignmentForStudent> {
    try {
      const assignmentData = { ...data, staffAssignmentID };

      const assignment: IAssignmentForStudent = await AssignmentForStudent.create(assignmentData);

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: GET ASSIGNMENT BY ID ✅
  //* Route: GET /assignments/student/{id}
  //****************************************************************************

  async getAssignmentByID(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findById(id)
        .populate({ path: 'schoolID', select: ['name'] })
        .populate({ path: 'branchID', select: ['name'] })
        .populate({ path: 'staffID', select: ['firstname', 'lastname'] })
        .populate({ path: 'classID', select: ['name', 'subject', 'level', 'cefr'] })
        .populate({ path: 'studentID', select: ['firstname', 'lastname', 'avatar'] })
        .populate({ path: 'academicTimeframe.academicYear', select: ['name', 'start_date', 'end_date'] })
        .populate({ path: 'academicTimeframe.academicPeriod', select: ['name', 'start_date', 'end_date'] })
        .populate({ path: 'academicTimeframe.academicTerm', select: ['name', 'start_date', 'end_date'] });

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: UPDATE ASSIGNMENT ✅
  //* Route: PUT /assignments/student/{id}
  //****************************************************************************

  async updateAssignment(id: string, data: Partial<IAssignmentForStudent>): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          ...data,
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DRAFT ASSIGNMENT ✅
  //* Route: PATCH /assignments/student/draft/{id}
  //****************************************************************************

  async draftAssignment(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          isDrafted: true,
          draftDate: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: UNDRAFT ASSIGNMENT ✅
  //* Route: PATCH /assignments/student/undraft/{id}
  //****************************************************************************

  async undraftAssignment(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          isDrafted: false,
          draftDate: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR ME ✅
  //* Route: PATCH /assignments/student/delete-for-me/{id}
  //****************************************************************************

  async deleteAssignmentTemporarilyForMe(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          isDeletedForMe: true,
          deletedForMeDate: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR ME ✅
  //* Route: DELETE /assignments/student/delete-for-me/{id}
  //****************************************************************************

  async deleteAssignmentPermanentlyForMe(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndDelete(id);

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR ME ✅
  //* Route: PATCH /assignments/student/restore-for-me/{id}
  //****************************************************************************

  async restoreAssignmentForMe(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          isDeletedForMe: false,
          deletedForMeDate: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR EVERYONE ✅
  //* Route: PATCH /assignments/student/delete-for-everyone/{id}
  //****************************************************************************

  async deleteAssignmentTemporarilyForEveryone(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          isDeletedForEveryone: true,
          deletedForEveryoneDate: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR EVERYONE ✅
  //* Route: DELETE /assignments/student/delete-for-everyone/{id}
  //****************************************************************************

  async deleteAssignmentPermanentlyForEveryone(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndDelete(id);

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR EVERYONE ✅
  //* Route: PATCH /assignments/student/restore-for-everyone/{id}
  //****************************************************************************

  async restoreAssignmentForEveryone(id: string): Promise<IAssignmentForStudent | null> {
    try {
      const assignment = await AssignmentForStudent.findByIdAndUpdate(
        id,
        {
          isDeletedForEveryone: false,
          deletedForEveryoneDate: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //* eBook
  async getEbookAssignment(assignmentId: string, activityId: string) {
    try {
      const result = await AssignmentForStudent.findOne(
        { _id: assignmentId, 'tasks.ebookActivityID': activityId },
        { 'tasks.$': 1 }
      );
      const task = result?.tasks?.[0];
      if (!task) throw new mongoose.Error.DocumentNotFoundError(null as any);
      const { assignedAs, attempts, duration, taskStatus, answersRevealed, incompleteWarnings, answers } = task;
      return { assignedAs, attempts, duration, taskStatus, answersRevealed, incompleteWarnings, answers };
    } catch (error) {
      throw error;
    }
  }

  async updateEbookAssignment(assignmentId: string, activityId: string, fieldsToUpdate: IAssignmentTaskFieldsToUpdate) {
    try {
      const data = Object.entries(fieldsToUpdate).reduce(
        (total, [nestedKey, nestedValue]) => ({ ...total, [`tasks.$.${nestedKey}`]: nestedValue }),
        {}
      );
      await AssignmentForStudent.findOneAndUpdate(
        { _id: assignmentId, 'tasks.ebookActivityID': activityId },
        { $set: data },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }
  //* eBook
}
