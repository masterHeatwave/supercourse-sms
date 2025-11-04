import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { AcademicOverviewService } from './overview.service';

export class AcademicOverviewController {
  private overviewService: AcademicOverviewService;

  constructor() {
    this.overviewService = new AcademicOverviewService();
  }

  getOverview = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await this.overviewService.getOverview();
    return jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: data.length,
      data,
    });
  });

  getOverviewForUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { userId } = req.params as { userId: string };
    const data = await this.overviewService.getOverviewForUser(userId);
    return jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: data.length,
      data,
    });
  });
}
