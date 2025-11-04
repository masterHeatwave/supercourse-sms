import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboardData = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const data = await this.dashboardService.getDashboardData(req.params.customer_id);

    res.status(200).json({
      success: true,
      data,
    });
  });
}
