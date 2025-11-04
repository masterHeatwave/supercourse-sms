import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { ErrorResponse } from '@utils/errorResponse';
import { SessionService } from './session.service';
import {
  createSessionSchema,
  updateSessionSchema,
  querySessionSchema,
  addStudentSchema,
  removeStudentSchema,
  addTeacherSchema,
  removeTeacherSchema,
  OSTokenSchema,
} from './session-validate.schema';
import {
  ISessionCreateDTO,
  ISessionUpdateDTO,
  IBulkSessionCreateDTO,
  IBulkSessionUpdateDTO,
} from './session.interface';

export class SessionController {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  getAllSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = querySessionSchema.parse(req.query);
    const sessions = await this.sessionService.getAllSessions(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: sessions,
    });
  });

  getSessionById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const session = await this.sessionService.getSessionById(req.params.id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: session,
      });
    } catch (error: any) {
      if (error.message.includes('Session not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'session',
            resourceId: req.params.id,
            message: 'Session not found',
          },
        });
      } else {
        throw error;
      }
    }
  });

  createSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const sessionData: ISessionCreateDTO = createSessionSchema.parse(req.body);
      const allowOverlap = req.query.allowOverlap === 'true';

      const result = await this.sessionService.createSession(sessionData, allowOverlap);

      jsonResponse(res, {
        status: StatusCodes.CREATED,
        success: true,
        data: result,
        warnings: result.warnings,
        message: result.isRecurring
          ? `Successfully created ${result.totalSessions} recurring sessions`
          : 'Session successfully created',
      });
    } catch (error: any) {
      if (error.message.includes('Session overlaps detected')) {
        jsonResponse(res, {
          status: StatusCodes.CONFLICT,
          success: false,
          error: {
            type: 'OVERLAP_ERROR',
            message: error.message,
            details: this.extractOverlapDetails(error.message),
          },
        });
      } else if (error.message.includes('Duration must be at least')) {
        jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            field: 'duration',
            message: error.message,
          },
        });
      } else if (error.message.includes('required for recurring sessions')) {
        jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'RECURRING_VALIDATION_ERROR',
            message: error.message,
            requiredFields: ['day', 'frequency', 'start_time', 'duration'],
          },
        });
      } else if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'REFERENCE_NOT_FOUND',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  createBulkSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const bulkData: IBulkSessionCreateDTO = {
        sessions: req.body.sessions,
        allowOverlap: req.query.allowOverlap === 'true' || req.body.allowOverlap === true,
      };

      if (!bulkData.sessions || !Array.isArray(bulkData.sessions)) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            field: 'sessions',
            message: 'Sessions must be provided as an array',
          },
        });
      }

      if (bulkData.sessions.length === 0) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            field: 'sessions',
            message: 'At least one session must be provided',
          },
        });
      }

      const result = await this.sessionService.createBulkSessions(bulkData);

      jsonResponse(res, {
        status: StatusCodes.CREATED,
        success: true,
        data: result,
        warnings: result.warnings,
        message: `Successfully created ${result.totalCreated} sessions from ${bulkData.sessions.length} requests`,
      });
    } catch (error: any) {
      if (error.message.includes('Session overlaps detected')) {
        jsonResponse(res, {
          status: StatusCodes.CONFLICT,
          success: false,
          error: {
            type: 'BULK_OVERLAP_ERROR',
            message: error.message,
            details: this.extractOverlapDetails(error.message),
          },
        });
      } else {
        throw error;
      }
    }
  });

  updateSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const sessionData: ISessionUpdateDTO = updateSessionSchema.parse({
        id: req.params.id,
        ...req.body,
      });
      const allowOverlap = req.query.allowOverlap === 'true';

      const result = await this.sessionService.updateSession(req.params.id, sessionData, allowOverlap);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: result,
        warnings: result.warnings,
        message: result.isRecurring
          ? `Successfully updated recurring session with ${result.totalSessions} instances`
          : 'Session successfully updated',
      });
    } catch (error: any) {
      if (error.message.includes('Session overlaps detected')) {
        jsonResponse(res, {
          status: StatusCodes.CONFLICT,
          success: false,
          error: {
            type: 'UPDATE_OVERLAP_ERROR',
            message: error.message,
            details: this.extractOverlapDetails(error.message),
          },
        });
      } else if (error.message.includes('Session not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'session',
            resourceId: req.params.id,
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  updateBulkSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const bulkData: IBulkSessionUpdateDTO = {
        sessions: req.body.sessions,
        allowOverlap: req.query.allowOverlap === 'true' || req.body.allowOverlap === true,
      };

      if (!bulkData.sessions || !Array.isArray(bulkData.sessions)) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            field: 'sessions',
            message: 'Sessions must be provided as an array',
          },
        });
      }

      if (bulkData.sessions.length === 0) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            field: 'sessions',
            message: 'At least one session must be provided',
          },
        });
      }

      const result = await this.sessionService.updateBulkSessions(bulkData);

      const hasFailures = result.failed > 0;
      const statusCode = hasFailures
        ? result.successful > 0
          ? StatusCodes.PARTIAL_CONTENT
          : StatusCodes.BAD_REQUEST
        : StatusCodes.OK;

      jsonResponse(res, {
        status: statusCode,
        success: result.failed === 0,
        data: result,
        message: `Processed ${result.totalProcessed} sessions: ${result.successful} successful, ${result.failed} failed`,
      });
    } catch (error: any) {
      throw error;
    }
  });

  deleteSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      await this.sessionService.deleteSession(req.params.id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: {},
        message: 'Session successfully deleted',
      });
    } catch (error: any) {
      if (error.message.includes('Session not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'session',
            resourceId: req.params.id,
            message: 'Session not found',
          },
        });
      } else {
        throw error;
      }
    }
  });

  addStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { session_id, student_id } = addStudentSchema.parse(req.body);
      const session = await this.sessionService.addStudent(session_id, student_id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: session,
        message: 'Student successfully added to session',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        const resource = error.message.includes('Student') ? 'student' : 'session';
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource,
            message: error.message,
          },
        });
      } else if (error.message.includes('already in this session')) {
        jsonResponse(res, {
          status: StatusCodes.CONFLICT,
          success: false,
          error: {
            type: 'DUPLICATE_ERROR',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  removeStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { session_id, student_id } = removeStudentSchema.parse(req.body);
      const session = await this.sessionService.removeStudent(session_id, student_id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: session,
        message: 'Student successfully removed from session',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'session',
            message: error.message,
          },
        });
      } else if (error.message.includes('not in this session')) {
        jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'NOT_ENROLLED_ERROR',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  addTeacher = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { session_id, teacher_id } = addTeacherSchema.parse(req.body);
      const session = await this.sessionService.addTeacher(session_id, teacher_id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: session,
        message: 'Teacher successfully added to session',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        const resource = error.message.includes('Teacher') ? 'teacher' : 'session';
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource,
            message: error.message,
          },
        });
      } else if (error.message.includes('already in this session')) {
        jsonResponse(res, {
          status: StatusCodes.CONFLICT,
          success: false,
          error: {
            type: 'DUPLICATE_ERROR',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  createOnlineSessionToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { id, roomName, currentRoleTitle } = OSTokenSchema.parse(req.body);
      const token = await this.sessionService.createOnlineSessionToken(id, roomName, currentRoleTitle);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: token,
        message: 'Token successfully created',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'session',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  removeTeacher = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { session_id, teacher_id } = removeTeacherSchema.parse(req.body);
      const session = await this.sessionService.removeTeacher(session_id, teacher_id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: session,
        message: 'Teacher successfully removed from session',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        jsonResponse(res, {
          status: StatusCodes.NOT_FOUND,
          success: false,
          error: {
            type: 'NOT_FOUND_ERROR',
            resource: 'session',
            message: error.message,
          },
        });
      } else if (error.message.includes('not in this session')) {
        jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'NOT_ASSIGNED_ERROR',
            message: error.message,
          },
        });
      } else {
        throw error;
      }
    }
  });

  getSessionPreview = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { day, start_date, end_date, frequency, start_time, duration } = req.query;

      if (!day || !start_date || !end_date || !frequency || !start_time || !duration) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Missing required parameters: day, start_date, end_date, frequency, start_time, duration',
            requiredFields: ['day', 'start_date', 'end_date', 'frequency', 'start_time', 'duration'],
          },
        });
      }

      const preview = await this.sessionService.getSessionPreview(
        day as string,
        new Date(start_date as string),
        new Date(end_date as string),
        parseInt(frequency as string),
        start_time as string,
        parseFloat(duration as string)
      );

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: preview,
      });
    } catch (error: any) {
      if (error.message.includes('No valid sessions can be generated')) {
        jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'RECURRING_SESSION_ERROR',
            message: error.message,
            suggestion: 'Please check your date range and selected day of the week',
          },
        });
      } else if (error.message.includes('Frequency') && error.message.includes('requires at least')) {
        jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'FREQUENCY_ERROR',
            message: error.message,
            suggestion: 'Reduce the frequency or extend the date range',
          },
        });
      } else {
        throw error;
      }
    }
  });

  // Validation endpoint to check for potential overlaps before creating sessions
  validateSessionOverlaps = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const sessionData: ISessionCreateDTO = req.body;

      if (!sessionData) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Session data is required',
          },
        });
      }

      // This is a dry-run validation - we'll simulate the creation to check for overlaps
      // without actually persisting to the database
      try {
        const result = await this.sessionService.createSession(sessionData, false);

        jsonResponse(res, {
          status: StatusCodes.OK,
          success: true,
          data: {
            valid: true,
            message: 'No overlaps detected - safe to create',
            estimatedSessions: result.isRecurring ? result.totalSessions : 1,
          },
        });
      } catch (error: any) {
        if (error.message.includes('Session overlaps detected')) {
          jsonResponse(res, {
            status: StatusCodes.OK,
            success: true,
            data: {
              valid: false,
              hasOverlaps: true,
              error: {
                type: 'OVERLAP_WARNING',
                message: error.message,
                details: this.extractOverlapDetails(error.message),
              },
            },
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
  });

  // Helper method to extract overlap details from error messages for frontend consumption
  private extractOverlapDetails(errorMessage: string) {
    const details: any = {
      conflicts: [],
      suggestions: [
        'Consider using different time slots',
        'Use different classrooms for conflicting sessions',
        'Enable allowOverlap=true if overlaps are intentional',
      ],
    };

    // Extract specific conflict information from error message
    if (errorMessage.includes('taxi:')) {
      details.conflictType = 'taxi_and_classroom';
      details.message = 'Same class cannot use the same classroom at overlapping times';
      details.suggestions.unshift('Choose a different classroom for one of the sessions');
    } else if (errorMessage.includes('classroom:')) {
      details.conflictType = 'classroom';
      details.message = 'Classroom is already occupied during this time';
      details.suggestions.unshift('Choose a different classroom or time slot');
    } else if (errorMessage.includes('students')) {
      details.conflictType = 'students';
      details.message = 'Some students have conflicting sessions';
      details.suggestions.unshift('Adjust the session timing to avoid student conflicts');
    } else if (errorMessage.includes('teachers')) {
      details.conflictType = 'teachers';
      details.message = 'Some teachers have conflicting sessions';
      details.suggestions.unshift('Assign different teachers or adjust the timing');
    }

    // Try to extract time information if available
    const timeMatch = errorMessage.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    if (timeMatch) {
      details.conflictTime = timeMatch[1];
    }

    return details;
  }
}
