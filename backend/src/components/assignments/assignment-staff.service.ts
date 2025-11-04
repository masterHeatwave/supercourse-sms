import { AssignmentForStaff } from './assignment-staff.model';
import { IAssignmentForStaff } from './assignment-staff.interface';
import { AssignmentForStudent } from './assignment-student.model';
import { IAssignmentForStudent } from './assignment-student.interface';

export class AssignmentStaffService {
  //****************************************************************************
  //* Controller method for: GET ALL ASSIGNMENTS
  //* Route: GET /assignments/staff
  //****************************************************************************

  async getAllAssignments(
    filters: {
      branchID: string;
      staffRole: 'admin' | 'manager' | 'teacher';
      staffID?: string; // Optional, only for teacher role to show assignments created by them
      classID?: string;
      classIDs?: string[]; // Optional, only for teacher role to show assignments for their classes
      // studentID?: string;
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
      // studentID,
      academicYearID,
      academicPeriodID,
      academicSubperiodID,
      isDrafted,
      isDeletedForMe,
      isDeletedForEveryone,
    } = filters;
    let filter: any = {};

    try {
      switch (staffRole) {
        case 'admin':
        case 'manager':
          filter = { branchID };
          if (classID) filter.classID = classID;
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

      // if (classID && !classIDs) filter.classID = classID;
      // if (studentID) filter['studentsIDs'] = studentID;
      if (academicYearID) filter['academicTimeframe.academicYear'] = academicYearID;
      if (academicPeriodID) filter['academicTimeframe.academicPeriod'] = academicPeriodID;
      if (academicSubperiodID) filter['academicTimeframe.academicTerm'] = academicSubperiodID;
      if (typeof isDrafted === 'boolean') filter.isDrafted = isDrafted;
      if (typeof isDeletedForMe === 'boolean') filter.isDeletedForMe = isDeletedForMe;
      if (typeof isDeletedForEveryone === 'boolean') filter.isDeletedForEveryone = isDeletedForEveryone;

      console.log('Filter applied:', filter);

      const assignments = await AssignmentForStaff.find(filter)
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
  //* Controller method for: CREATE ASSIGNMENT
  //* Route: POST /assignments/staff
  //****************************************************************************

  async createAssignment(data: IAssignmentForStaff, isDrafted: boolean): Promise<IAssignmentForStaff> {
    try {
      const assignmentData = {
        ...data,
        isDrafted,
        ...(isDrafted && { draftDate: new Date() }),
      };

      const assignment: IAssignmentForStaff = await AssignmentForStaff.create(assignmentData);

      // If not drafted, create individual assignments for each student
      if (!isDrafted && data.studentsIDs && data.studentsIDs.length > 0) {
        const studentAssignments = data.studentsIDs.map((studentID) => ({
          schoolID: data.schoolID,
          branchID: data.branchID,
          staffID: data.staffID,
          staffRole: data.staffRole,
          staffAssignmentID: assignment._id,
          classID: data.classID,
          studentID: studentID,
          title: data.title,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          tasks: data.tasks?.map((task) => ({
            resourceType: task.resourceType,
            ebookID: task.ebookID,
            ebookActivityID: task.ebookActivityID,
            customActivityID: task.customActivityID,
            openTaskType: task.openTaskType,
            openTaskTitle: task.openTaskTitle,
            openTaskInstructions: task.openTaskInstructions,
            assignedAs: task.assignedAs,
            instructions: task.instructions,
            attempts: 0,
            duration: 0,
            score: 0,
            taskStatus: 'new' as const,
            answers: {},
            answersRevealed: false,
          })),
          assignmentStatus: 'new' as const,
          academicTimeframe: data.academicTimeframe,
          isDeletedForMe: false,
          isDeletedForEveryone: false,
          isPermanentlyDeleted: false,
        }));

        await AssignmentForStudent.insertMany(studentAssignments);
      }

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: GET ASSIGNMENT BY ID
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
  //* Controller method for: UPDATE ASSIGNMENT
  //* Route: PUT /assignments/staff/{id}
  //****************************************************************************

  async updateAssignment(id: string, data: Partial<IAssignmentForStaff>): Promise<IAssignmentForStaff | null> {
    try {
      const assignment = await AssignmentForStaff.findByIdAndUpdate(id, data, { new: true });
      return assignment;
    } catch (error) {
      throw error;
    }
  }

  //****************************************************************************
  //* Controller method for: DRAFT ASSIGNMENT
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
  //* Controller method for: UNDRAFT ASSIGNMENT
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
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR ME
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
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR ME
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
  //* Controller method for: RESTORE ASSIGNMENT FOR ME
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
}
