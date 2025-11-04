import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { AcademicSubperiodService } from './academic-subperiods.service';
import {
  createAcademicSubperiodSchema,
  updateAcademicSubperiodSchema,
  queryAcademicSubperiodSchema,
} from './academic-subperiods-validate.schema';
import { IAcademicSubperiodCreateDTO, IAcademicSubperiodUpdateDTO } from './academic-subperiods.interface';

export class AcademicSubperiodController {
  private academicSubperiodService: AcademicSubperiodService;

  constructor() {
    this.academicSubperiodService = new AcademicSubperiodService();
  }

  getAllAcademicSubperiods = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryAcademicSubperiodSchema.parse(req.query);
    const academicSubperiods = await this.academicSubperiodService.getAllAcademicSubperiods(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: academicSubperiods.length,
      data: academicSubperiods,
    });
  });

  getAcademicSubperiodById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicSubperiod = await this.academicSubperiodService.getAcademicSubperiodById(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: academicSubperiod,
    });
  });

  getCurrentAcademicSubperiod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const currentAcademicSubperiod = await this.academicSubperiodService.getCurrentAcademicSubperiod();

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: currentAcademicSubperiod,
    });
  });

  createAcademicSubperiod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicSubperiodData: IAcademicSubperiodCreateDTO = createAcademicSubperiodSchema.parse(req.body);
    const academicSubperiod = await this.academicSubperiodService.createAcademicSubperiod(academicSubperiodData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: academicSubperiod,
    });
  });

  updateAcademicSubperiod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicSubperiodData: IAcademicSubperiodUpdateDTO = updateAcademicSubperiodSchema.parse({
      id: req.params.id,
      ...req.body,
    });

    const academicSubperiod = await this.academicSubperiodService.updateAcademicSubperiod(
      req.params.id,
      academicSubperiodData
    );

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: academicSubperiod,
    });
  });

  deleteAcademicSubperiod = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.academicSubperiodService.deleteAcademicSubperiod(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {},
      message: 'Academic subperiod successfully deleted',
    });
  });
}
