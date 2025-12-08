import { Request, Response, NextFunction } from 'express';
import { AssignmentStaffService } from '@components/assignments/assignment-staff.service';
import { AssignmentStudentService } from '@components/assignments/assignment-student.service';

import { IAssignmentForStaff } from '@components/assignments/assignment-staff.interface';

import { TaxiService } from '@components/taxi/taxi.service';

import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';

//* eBook
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import {
  getEbookAssignmentSchema,
  updateEbookAssignmentSchema,
} from '@components/assignments/assignment-student-validate.schema';
//* eBook

export class AssignmentStudentController {
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
  //* Route: GET /assignments/student
  //****************************************************************************

  getAllAssignments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
      branchID,
      studentID,
      academicYearID,
      academicPeriodID,
      academicSubperiodID,
      isDeletedForMe,
      isDeletedForEveryone,
    } = req.query;

    if (!branchID || !studentID || !academicYearID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'branchID, studentID and academicYearID are required!',
        success: false,
      });
    }

    const assignments = await this.assignmentStudentService.getAllAssignments(
      {
        branchID: branchID as string,
        studentID: studentID as string,
        ...(academicYearID && { academicYearID: academicYearID as string }),
        ...(academicPeriodID && { academicPeriodID: academicPeriodID as string }),
        ...(academicSubperiodID && { academicSubperiodID: academicSubperiodID as string }),
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
  //* Route: POST /assignments/student
  //****************************************************************************

  createAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { assignmentData, staffAssignmentID } = req.body;

    if (!assignmentData || !staffAssignmentID) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Both assignmentData and staffAssignmentID are required!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.createAssignment(assignmentData, staffAssignmentID);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: '500 Internal Server Error',
        message: 'Failed to create assignment.',
        success: false,
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
  //* Controller method for: GET ASSIGNMENT BY ID ✅
  //* Route: GET /assignments/student/{id}
  //****************************************************************************

  getAssignmentByID = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.getAssignmentByID(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id}.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was found successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: UPDATE ASSIGNMENT ✅
  //* Route: PUT /assignments/student/{id}
  //****************************************************************************

  updateAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { updateData } = req.body;

    if (!id || !updateData) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Both assignment ID and updateData are required!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.updateAssignment(id, updateData);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to update.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was updated successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DRAFT ASSIGNMENT ✅
  //* Route: PATCH /assignments/student/draft/{id}
  //****************************************************************************

  draftAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to draft assignment!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.draftAssignment(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to draft.`,
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
  //* Route: PATCH /assignments/student/undraft/{id}
  //****************************************************************************

  undraftAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to undraft assignment!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.undraftAssignment(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to undraft.`,
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
  //* Route: PATCH /assignments/student/delete-for-me/{id}
  //****************************************************************************

  deleteAssignmentTemporarilyForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to delete assignment for me!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.deleteAssignmentTemporarilyForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to delete for me.`,
        success: false,
      });
    }

    return jsonResponse(res, {
      status: StatusCodes.OK,
      data: assignment,
      message: `Assignment ${id} was deleted for me successfully!`,
      success: true,
      count: 1,
    });
  });

  //****************************************************************************
  //* Controller method for: DELETE ASSIGNMENT PERMANENTLY FOR ME ✅
  //* Route: DELETE /assignments/student/delete-for-me/{id}
  //****************************************************************************

  deleteAssignmentPermanentlyForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to permanently delete assignment for me!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.deleteAssignmentPermanentlyForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to permanently delete for me.`,
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
  //* Route: PATCH /assignments/student/restore-for-me/{id}
  //****************************************************************************

  restoreAssignmentForMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to restore assignment for me!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.restoreAssignmentForMe(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to restore for me.`,
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
  //* Route: PATCH /assignments/student/delete-for-everyone/{id}
  //****************************************************************************

  deleteAssignmentTemporarilyForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to delete assignment for everyone!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.deleteAssignmentTemporarilyForEveryone(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to delete for everyone.`,
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
  //* Route: DELETE /assignments/student/delete-for-everyone/{id}
  //****************************************************************************

  deleteAssignmentPermanentlyForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to permanently delete assignment for everyone!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.deleteAssignmentPermanentlyForEveryone(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to permanently delete for everyone.`,
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
  //* Route: PATCH /assignments/student/restore-for-everyone/{id}
  //****************************************************************************

  restoreAssignmentForEveryone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        error: '400 Bad Request',
        message: 'Assignment ID is required to restore assignment for everyone!',
        success: false,
      });
    }

    const assignment = await this.assignmentStudentService.restoreAssignmentForEveryone(id);

    if (!assignment) {
      return jsonResponse(res, {
        status: StatusCodes.NOT_FOUND,
        error: '404 Not Found',
        message: `No assignment found with ID ${id} to restore for everyone.`,
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

  //* eBook
  getEbookAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assignmentId, activityId } = getEbookAssignmentSchema.parse({
        assignmentId: req.params.assignmentId,
        activityId: req.params.activityId,
      });
      const result = await this.assignmentStudentService.getEbookAssignment(assignmentId, activityId);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });

  updateEbookAssignment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assignmentId, activityId, fieldsToUpdate } = updateEbookAssignmentSchema.parse({
        assignmentId: req.params.assignmentId,
        activityId: req.params.activityId,
        fieldsToUpdate: req.body,
      });
      await this.assignmentStudentService.updateEbookAssignment(assignmentId, activityId, fieldsToUpdate);
      return res.status(204).end();
    } catch (error) {
      const statusCode =
        error instanceof ZodError ||
        error instanceof mongoose.Error.ValidationError ||
        error?.constructor?.name === 'DocumentNotFoundError'
          ? 400
          : 500;
      return res.status(statusCode).json({
        statusCode,
        message: statusCode === 400 ? 'Not found error' : 'Internal server error',
        error: error?.constructor?.name || '',
      });
    }
  });
  //* eBook
}
