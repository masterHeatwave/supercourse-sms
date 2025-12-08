import { Request, Response, NextFunction } from 'express';
import { AssignmentStaffService } from '@components/assignments/assignment-staff.service';
import { AssignmentStudentService } from '@components/assignments/assignment-student.service';

import { IAssignmentForStudent } from '@components/assignments/assignment-student.interface';

import { TaxiService } from '@components/taxi/taxi.service';

import User from '@components/users/user.model';

import { IUser } from '@components/users/user.interface';

import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';

export class AssignmentStaffController {
  private assignmentStaffService: AssignmentStaffService;
  private assignmentStudentService: AssignmentStudentService;
  private taxiService: TaxiService;

  constructor() {
    this.assignmentStaffService = new AssignmentStaffService();
    this.assignmentStudentService = new AssignmentStudentService();
    this.taxiService = new TaxiService();
  }

  //****************************************************************************
  //* Controller method for: GET ALL ASSIGNMENTS ✅
  //* Route: GET /assignments/staff
  //****************************************************************************

  getAllAssignments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
      branchID,
      staffRole,
      staffID,
      classID,
      academicYearID,
      academicPeriodID,
      academicSubperiodID,
      isDrafted,
      isDeletedForMe,
      isDeletedForEveryone,
    } = req.query;

    if (!branchID || !staffRole || !academicYearID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'branchID, staffRole and academicYearID are required!',
        success: false,
      });
    }

    let classIDs: string[] = [];
    if (staffRole === 'teacher' && !staffID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID is required when staffRole is teacher!',
        success: false,
      });
    } else if (staffRole === 'teacher' && staffID) {
      // const isCurrentUserATeacher = await usersService.getStaffById(staffID as string);
      const isCurrentUserATeacher: IUser | null = await User.findById(staffID as string);

      if (staffRole === 'teacher' && isCurrentUserATeacher?.user_type === 'teacher') {
        const classes = await this.taxiService.getTaxisByUserId(staffID as string);
        classIDs = classes.filter((klass) => klass.branch == branchID).map((klass) => klass.id);
      } else {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          error: '400 Bad Request',
          message: 'staffID does not belong to a teacher!',
          success: false,
        });
      }
    }

    const assignments = await this.assignmentStaffService.getAllAssignments(
      {
        branchID: branchID as string,
        staffRole: staffRole as 'admin' | 'manager' | 'teacher',
        ...(staffID && { staffID: staffID as string }),
        ...(classID && { classID: classID as string }),
        ...(classIDs.length > 0 && { classIDs: classIDs }),
        ...(academicYearID && { academicYearID: academicYearID as string }),
        ...(academicPeriodID && { academicPeriodID: academicPeriodID as string }),
        ...(academicSubperiodID && { academicSubperiodID: academicSubperiodID as string }),
        ...(isDrafted !== undefined && { isDrafted: isDrafted === 'true' }),
        ...(isDeletedForMe !== undefined && { isDeletedForMe: isDeletedForMe === 'true' }),
        ...(isDeletedForEveryone !== undefined && { isDeletedForEveryone: isDeletedForEveryone === 'true' }),
      },
      {},
      {}
    );

    if (assignments.length === 0) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignments,
        message: 'No assignments were found!',
        success: true,
        count: assignments.length,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignments,
      message: `${assignments.length} assignment${assignments.length === 1 ? ' was' : 's were'} found.`,
      success: true,
      count: assignments.length,
    });
  });

  //****************************************************************************
  //* Controller method for: CREATE ASSIGNMENT ✅
  //* Route: POST /assignments/staff
  //****************************************************************************

  createAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const assignmentData = req.body;
    const isDrafted: boolean = req.query.isDrafted === 'false' ? false : true; //? Save mode

    if (!assignmentData || !isDrafted) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Both assignmentData and isDrafted are required!',
        success: false,
      });
    }

    const assignment = await this.assignmentStaffService.createAssignment(assignmentData, isDrafted);

    let studentAssignments: IAssignmentForStudent[] = [];

    if (!isDrafted && assignmentData.studentsIDs && assignmentData.studentsIDs.length > 0) {
      for (const studentID of assignmentData.studentsIDs) {
        const studentAssignmentData = {
          schoolID: assignmentData.schoolID,
          branchID: assignmentData.branchID,
          staffID: assignmentData.staffID,
          staffRole: assignmentData.staffRole,
          staffAssignmentID: assignment.id,
          ...(assignmentData.classID && { classID: assignmentData.classID }),
          ...(assignmentData.schoolID && { studentID: studentID }),
          title: assignmentData.title,
          startDate: assignmentData.startDate,
          endDate: assignmentData.endDate,
          description: assignmentData.description,
          tasks: assignmentData.tasks?.map((task: any) => ({
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
          academicTimeframe: assignmentData.academicTimeframe,
          isDeletedForMe: false,
          isDeletedForEveryone: false,
          isPermanentlyDeleted: false,
        };

        const studentAssignment = await this.assignmentStudentService.createAssignment(
          studentAssignmentData,
          assignment.id
        );

        studentAssignments.push(studentAssignment.id);
      }
    }

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No staff assignment was created!',
        success: true,
        count: 0,
      });
    }

    const studentMessage =
      studentAssignments.length > 0
        ? ` There were also ${studentAssignments.length} student assignment${studentAssignments.length === 1 ? '' : 's'} created with the following IDs: [${studentAssignments.join(', ')}].`
        : ` There weren't created any assignments for students.`;

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was created successfully!${studentMessage}`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: GET ASSIGNMENT BY ID ✅
  //* Route: GET /assignments/staff/{id}
  //****************************************************************************

  getAssignmentByID = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate that the staff ID belongs to the given role
    // const staff = await usersService.querySingle(staffID as string);
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate that the staff ID belongs to the given role

    const assignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id}.`,
        success: false,
      });
    }

    if (assignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (assignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to access this assignment (wrong staff ID).',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (assignment.toObject().classID.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === assignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message: 'You do not have permission to access this assignment because you don`t belong to the class.',
            success: false,
          });
        }
      }
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was found successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: UPDATE ASSIGNMENT ✅
  //* Route: PUT /assignments/staff/{id}
  //****************************************************************************

  updateAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required!',
        success: false,
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Update data cannot be empty!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    // const staff = await usersService.getStaffById(staffID as string);
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to update.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to update this assignment.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message: "You do not have permission to update this assignment because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const protectedFields = ['id', 'schoolID', 'branchID'];
    protectedFields.forEach((field) => delete updateData[field]);

    const assignment = await this.assignmentStaffService.updateAssignment(id, updateData);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to update assignment ${id}.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was updated successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DRAFT ASSIGNMENT ✅
  //* Route: PATCH /assignments/staff/draft/{id}
  //****************************************************************************

  draftAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to draft assignment!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    // const staff = await usersService.getStaffById(staffID as string);
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to draft.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to draft this assignment.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message: "You do not have permission to draft this assignment because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.draftAssignment(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to draft assignment ${id}.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was drafted successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: UNDRAFT ASSIGNMENT ✅
  //* Route: PATCH /assignments/staff/undraft/{id}
  //****************************************************************************

  undraftAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to undraft assignment!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    // const staff = await usersService.getStaffById(staffID as string);
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to undraft.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to undraft this assignment.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message: "You do not have permission to undraft this assignment because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.undraftAssignment(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to undraft assignment ${id}.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was undrafted successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR ME ✅
  //* Route: PATCH /assignments/staff/delete-for-me/{id}
  //****************************************************************************

  deleteAssignmentTemporarilyForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to delete assignment for me!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to delete for me.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to delete this assignment.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message: "You do not have permission to delete this assignment because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.deleteAssignmentTemporarilyForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to delete assignment ${id} for me.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was temporarily deleted for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR ME ✅
  //* Route: DELETE /assignments/staff/delete-for-me/{id}
  //****************************************************************************

  deleteAssignmentPermanentlyForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to permanently delete assignment for me!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to permanently delete for me.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to permanently delete this assignment.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message:
              "You do not have permission to permanently delete this assignment because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.deleteAssignmentPermanentlyForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to permanently delete assignment ${id} for me.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was permanently deleted for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR ME ✅
  //* Route: PATCH /assignments/staff/restore-for-me/{id}
  //****************************************************************************

  restoreAssignmentForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to restore assignment for me!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to restore for me.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to restore this assignment.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message: "You do not have permission to restore this assignment because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.restoreAssignmentForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to restore assignment ${id} for me.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was restored for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR EVERYONE ✅
  //* Route: PATCH /assignments/staff/delete-for-everyone/{id}
  //****************************************************************************

  deleteAssignmentTemporarilyForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to delete assignment for everyone!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to delete for everyone.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to delete this assignment for everyone.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message:
              "You do not have permission to delete this assignment for everyone because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.deleteAssignmentTemporarilyForEveryone(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to delete assignment ${id} for everyone.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was deleted for everyone successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR EVERYONE ✅
  //* Route: DELETE /assignments/staff/delete-for-everyone/{id}
  //****************************************************************************

  deleteAssignmentPermanentlyForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to permanently delete assignment for everyone!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to permanently delete for everyone.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to permanently delete this assignment for everyone.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message:
              "You do not have permission to permanently delete this assignment for everyone because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.deleteAssignmentPermanentlyForEveryone(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to permanently delete assignment ${id} for everyone.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was permanently deleted for everyone successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR EVERYONE ✅
  //* Route: PATCH /assignments/staff/restore-for-everyone/{id}
  //****************************************************************************

  restoreAssignmentForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffID, staffRole, branchID } = req.query;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to restore assignment for everyone!',
        success: false,
      });
    }

    if (!staffID || !staffRole || !branchID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'staffID, staffRole, and branchID are required for authorization!',
        success: false,
      });
    }

    // Validate staff member exists and has correct role
    const staff: IUser | null = await User.findById(staffID as string);

    if (!staff) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: 'Staff member not found!',
        success: false,
      });
    }

    if (staff.user_type !== staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: `Staff ID does not belong to a ${staffRole}. The staff member has role: ${staff.user_type}`,
        success: false,
      });
    }
    // Validate staff member exists and has correct role

    const existingAssignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!existingAssignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to restore for everyone.`,
        success: false,
      });
    }

    if (existingAssignment.toObject().branchID.id !== branchID) {
      return jsonResponse(res, {
        status: StatusCodes.FORBIDDEN,
        error: '403 Forbidden',
        message: 'This assignment does not belong to the branch you are currently at.',
        success: false,
      });
    }

    if (staffRole === 'teacher') {
      //! Maybe needs to be removed
      if (existingAssignment.toObject().staffID.id !== staffID) {
        return jsonResponse(res, {
          status: StatusCodes.FORBIDDEN,
          error: '403 Forbidden',
          message: 'You do not have permission to restore this assignment for everyone.',
          success: false,
        });
      }
      //! Maybe needs to be removed

      if (existingAssignment.toObject().classID?.id) {
        const teacherClasses = await this.taxiService.getTaxisByUserId(staffID as string);
        const hasAccess = teacherClasses.some((klass) => klass.id === existingAssignment.toObject().classID.id);

        if (!hasAccess) {
          return jsonResponse(res, {
            status: StatusCodes.FORBIDDEN,
            error: '403 Forbidden',
            message:
              "You do not have permission to restore this assignment for everyone because you don't belong to the class.",
            success: false,
          });
        }
      }
    }

    const assignment = await this.assignmentStaffService.restoreAssignmentForEveryone(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: `Failed to restore assignment ${id} for everyone.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was restored for everyone successfully!`,
      success: true,
      count: 1,
    });
  });
}
