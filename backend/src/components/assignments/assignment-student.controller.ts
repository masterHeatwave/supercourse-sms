import { Request, Response, NextFunction } from 'express';
import { AssignmentStudentService } from './assignment-student.service';

import { TaxiService } from '@components/taxi/taxi.service';

import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';

export class AssignmentStudentController {
  private assignmentStudentService: AssignmentStudentService;
  private taxiService: TaxiService;

  constructor() {
    this.assignmentStudentService = new AssignmentStudentService();
    this.taxiService = new TaxiService();
  }

  getAllAssignments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {});

  getAssignmentByID = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {});
}
