import { AssignmentForStaff } from '@components/assignments/assignment-staff.model';
import { AssignmentForStudent } from '@components/assignments/assignment-student.model';

import { IAssignmentForStaff } from '@components/assignments/assignment-staff.interface';

export class AssignmentStaffService {
  //****************************************************************************
  //* Controller method for: GET ALL ASSIGNMENTS ✅
  //* Route: GET /assignments/staff
  //****************************************************************************

  async getAllAssignments(
    filters: {
      branchID: string;
      staffRole: 'admin' | 'manager' | 'teacher';
      staffID?: string; // Optional, only for teacher role to show assignments created by them //! Probably needs to be removed
      classID?: string;
      classIDs?: string[]; // Optional, only for teacher role to show assignments for their classes
      academicYearID?: string;
      academicPeriodID?: string;
      academicSubperiodID?: string;
      isDrafted?: boolean;
      isDeletedForMe?: boolean;
      isDeletedForEveryone?: boolean;
    } = {} as any,
    projection = {},
    options = {}
  ): Promise<IAssignmentForStaff[]> {
    const {
      branchID,
      staffRole,
      staffID,
      classID,
      classIDs,
      academicYearID,
      academicPeriodID,
      academicSubperiodID,
      isDrafted,
      isDeletedForMe,
      isDeletedForEveryone,
    } = filters;
    let filter: any = {};

    switch (staffRole) {
      case 'admin':
      case 'manager':
        filter = { branchID };
        break;
      case 'teacher':
        filter = { branchID };
        if (classIDs && classIDs.length > 0) {
          filter.classID = { $in: classIDs };
        }
        break;
      default:
        filter = { branchID };
        break;
    }

    if (classID && !classIDs) filter.classID = classID; // Only if classIDs is not provided, for admin/manager roles
    if (academicYearID) filter['academicTimeframe.academicYear'] = academicYearID;
    if (academicPeriodID) filter['academicTimeframe.academicPeriod'] = academicPeriodID;
    if (academicSubperiodID) {
      if (academicSubperiodID.includes(',')) {
        const subperiodIDs = academicSubperiodID.split(',').map((id) => id.trim());
        filter['academicTimeframe.academicTerm'] = { $in: subperiodIDs };
      } else {
        filter['academicTimeframe.academicTerm'] = academicSubperiodID;
      }
    }
    if (typeof isDrafted === 'boolean') filter.isDrafted = isDrafted;
    if (typeof isDeletedForMe === 'boolean') filter.isDeletedForMe = isDeletedForMe;
    if (typeof isDeletedForEveryone === 'boolean') filter.isDeletedForEveryone = isDeletedForEveryone;

    try {
      const assignments = await AssignmentForStaff.find(filter, projection, options)
        .populate({ path: 'schoolID', select: ['name'] })
        .populate({ path: 'branchID', select: ['name'] })
        .populate({ path: 'classID', select: ['name', 'subject', 'level', 'cefr'] })
        .populate({ path: 'staffID', select: ['firstname', 'lastname'] })
        .populate({ path: 'studentsIDs', select: ['firstname', 'lastname', 'avatar'] })
        .populate({ path: 'tasks.ebookID', select: ['title'] })
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
  //* Route: POST /assignments/staff
  //****************************************************************************

  async createAssignment(data: IAssignmentForStaff, isDrafted: boolean): Promise<IAssignmentForStaff> {
    try {
      const assignmentData = { ...data, isDrafted, ...(isDrafted && { draftDate: new Date() }) };

      const assignment: IAssignmentForStaff = await AssignmentForStaff.create(assignmentData);

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: GET ASSIGNMENT BY ID ✅
  //* Route: GET /assignments/staff/{id}
  //****************************************************************************

  async getAssignmentByID(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findById(id)
        .populate({ path: 'schoolID', select: ['name'] })
        .populate({ path: 'branchID', select: ['name'] })
        .populate({ path: 'classID', select: ['name', 'subject', 'level', 'cefr'] })
        .populate({ path: 'staffID', select: ['firstname', 'lastname'] })
        .populate({ path: 'studentsIDs', select: ['firstname', 'lastname', 'avatar'] })
        .populate({ path: 'tasks.ebookID', select: ['title'] })
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
  //* Route: PUT /assignments/staff/{id}
  //****************************************************************************

  async updateAssignment(id: string, data: Partial<IAssignmentForStaff>): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
        id,
        {
          ...data,
          $inc: { __v: 1 },
        },
        {
          new: true,
        }
      );

      if (assignment) {
        await AssignmentForStudent.updateMany(
          { staffAssignmentID: id },
          {
            ...data,
            $inc: { __v: 1 },
          }
        );
      }

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DRAFT ASSIGNMENT ✅
  //* Route: PATCH /assignments/staff/draft/{id}
  //****************************************************************************

  async draftAssignment(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
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
  //* Route: PATCH /assignments/staff/undraft/{id}
  //****************************************************************************

  async undraftAssignment(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
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
  //* Route: PATCH /assignments/staff/delete-for-me/{id}
  //****************************************************************************

  async deleteAssignmentTemporarilyForMe(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
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
  //* Route: DELETE /assignments/staff/delete-for-me/{id}
  //****************************************************************************

  async deleteAssignmentPermanentlyForMe(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndDelete(id);

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR ME ✅
  //* Route: PATCH /assignments/staff/restore-for-me/{id}
  //****************************************************************************

  async restoreAssignmentForMe(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
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
  //* Route: PATCH /assignments/staff/delete-for-everyone/{id}
  //****************************************************************************

  async deleteAssignmentTemporarilyForEveryone(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
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

      if (assignment) {
        await AssignmentForStudent.updateMany(
          { staffAssignmentID: id },
          {
            isDeletedForEveryone: true,
            deletedForEveryoneDate: new Date(),
            $inc: { __v: 1 },
          }
        );
      }

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR EVERYONE ✅
  //* Route: DELETE /assignments/staff/delete-for-everyone/{id}
  //****************************************************************************

  async deleteAssignmentPermanentlyForEveryone(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndDelete(id);

      if (assignment) {
        await AssignmentForStudent.deleteMany({ staffAssignmentID: id });
      }

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR EVERYONE ✅
  //* Route: PATCH /assignments/staff/restore-for-everyone/{id}
  //****************************************************************************

  async restoreAssignmentForEveryone(id: string): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(
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

      if (assignment) {
        await AssignmentForStudent.updateMany(
          { staffAssignmentID: id },
          {
            isDeletedForEveryone: false,
            deletedForEveryoneDate: new Date(),
            $inc: { __v: 1 },
          }
        );
      }

      return assignment;
    } catch (error) {
      throw error;
    }
  }
}
