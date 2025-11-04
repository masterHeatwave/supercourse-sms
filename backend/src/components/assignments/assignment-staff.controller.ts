import { Request, Response, NextFunction } from 'express';
import { AssignmentStaffService } from './assignment-staff.service';

import { TaxiService } from '@components/taxi/taxi.service';
import querySingle from '@components/users/users.service';

import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';

export class AssignmentStaffController {
  private assignmentStaffService: AssignmentStaffService;
  private taxiService: TaxiService;

  constructor() {
    this.assignmentStaffService = new AssignmentStaffService();
    this.taxiService = new TaxiService();
  }

  //****************************************************************************
  //* Controller method for: GET ALL ASSIGNMENTS
  //* Route: GET /assignments/staff
  //****************************************************************************

  getAllAssignments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
      branchID,
      staffRole,
      staffID,
      classID,
      // studentID,
      academicYearID,
      academicPeriodID,
      academicSubperiodID,
      isDrafted,
      isDeletedForMe,
      isDeletedForEveryone,
    } = req.query;

    if (!branchID || !staffRole) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'branchID and staffRole are required!',
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
      const isCurrentUserATeacher = await querySingle.querySingle(staffID as string);
      // let classIDs: string[] = [];
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
        ...(classIDs.length > 0 && { classIDs: classIDs }),
        ...(classID && { classID: classID as string }),
        // ...(studentID && { studentID: studentID as string }),
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
  //* Controller method for: CREATE ASSIGNMENT
  //* Route: POST /assignments/staff
  //****************************************************************************

  createAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const assignmentData = req.body;
    const isDrafted: boolean = req.query.isDrafted === 'false' ? false : true;

    const assignment = await this.assignmentStaffService.createAssignment(assignmentData, isDrafted);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignment was created!',
        success: true,
        count: 0,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was created successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: GET ASSIGNMENT BY ID
  //* Route: GET /assignments/staff/{id}
  //****************************************************************************

  getAssignmentByID = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assignment = await this.assignmentStaffService.getAssignmentByID(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignment was found!',
        success: true,
        count: 0,
      });
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
  //* Controller method for: UPDATE ASSIGNMENT
  //* Route: PUT /assignments/staff/{id}
  //****************************************************************************

  updateAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    const assignment = await this.assignmentStaffService.updateAssignment(id, updateData);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignments were found!',
        success: true,
        count: 0,
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
  //* Controller method for: DRAFT ASSIGNMENT
  //* Route: PATCH /assignments/staff/draft/{id}
  //****************************************************************************

  draftAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assignment = await this.assignmentStaffService.draftAssignment(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignments were found!',
        success: true,
        count: 0,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was drafted successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: UNDRAFT ASSIGNMENT
  //* Route: PATCH /assignments/staff/undraft/{id}
  //****************************************************************************

  undraftAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assignment = await this.assignmentStaffService.undraftAssignment(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignments were found!',
        success: true,
        count: 0,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was undrafted successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR ME
  //* Route: PATCH /assignments/staff/delete-for-me/{id}
  //****************************************************************************

  deleteAssignmentTemporarilyForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assignment = await this.assignmentStaffService.deleteAssignmentTemporarilyForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignments were found!',
        success: true,
        count: 0,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was temporarily deleted for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR ME
  //* Route: DELETE /assignments/staff/delete-for-me/{id}
  //****************************************************************************

  deleteAssignmentPermanentlyForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assignment = await this.assignmentStaffService.deleteAssignmentPermanentlyForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignments were found!',
        success: true,
        count: 0,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was permanently deleted for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR ME
  //* Route: PATCH /assignments/staff/restore-for-me/{id}
  //****************************************************************************

  restoreAssignmentForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assignment = await this.assignmentStaffService.restoreAssignmentForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: assignment,
        message: 'No assignments were found!',
        success: true,
        count: 0,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${assignment.id} was restored for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT TEMPORARILY FOR EVERYONE
  //* Route: PATCH /assignments/staff/delete-for-everyone/{id}
  //****************************************************************************

  deleteAssignmentTemporarilyForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {});

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR EVERYONE
  //* Route: DELETE /assignments/staff/delete-for-everyone/{id}
  //****************************************************************************

  deleteAssignmentPermanentlyForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {});

  //****************************************************************************
  //* Controller method for: RESTORE ASSIGNMENT FOR EVERYONE
  //* Route: PATCH /assignments/staff/restore-for-everyone/{id}
  //****************************************************************************

  restoreAssignmentForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {});
}
