import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { AcademicPeriodService } from './academic-periods.service';
import {
  createAcademicPeriodSchema,
  updateAcademicPeriodSchema,
  queryAcademicPeriodSchema,
} from './academic-periods-validate.schema';
import { IAcademicPeriodCreateDTO, IAcademicPeriodUpdateDTO } from './academic-periods.interface';

export class AcademicPeriodController {
  private academicPeriodService: AcademicPeriodService;

  constructor() {
    this.academicPeriodService = new AcademicPeriodService();
  }

  getAllAcademicPeriods = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryAcademicPeriodSchema.parse(req.query);
    const academicPeriods = await this.academicPeriodService.getAllAcademicPeriods(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: academicPeriods.length,
      data: academicPeriods,
    });
  });

  getAcademicPeriodById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicPeriod = await this.academicPeriodService.getAcademicPeriodById(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: academicPeriod,
    });
  });

  getCurrentAcademicPeriod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const currentAcademicPeriod = await this.academicPeriodService.getCurrentAcademicPeriod();

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: currentAcademicPeriod,
    });
  });

  createAcademicPeriod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicPeriodData: IAcademicPeriodCreateDTO = createAcademicPeriodSchema.parse(req.body);
    const academicPeriod = await this.academicPeriodService.createAcademicPeriod(academicPeriodData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: academicPeriod,
    });
  });

  updateAcademicPeriod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicPeriodData: IAcademicPeriodUpdateDTO = updateAcademicPeriodSchema.parse({
      id: req.params.id,
      ...req.body,
    });

    const academicPeriod = await this.academicPeriodService.updateAcademicPeriod(req.params.id, academicPeriodData);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: academicPeriod,
    });
  });

  deleteAcademicPeriod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.academicPeriodService.deleteAcademicPeriod(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {},
      message: 'Academic period successfully deleted',
    });
  });
}
