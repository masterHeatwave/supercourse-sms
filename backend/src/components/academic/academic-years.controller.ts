import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { AcademicYearService } from './academic-years.service';
import { IAcademicYearCreateDTO, IAcademicYearUpdateDTO } from './academic-years.interface';

export class AcademicYearController {
  private academicYearService: AcademicYearService;

  constructor() {
    this.academicYearService = new AcademicYearService();
  }

  getAllAcademicYears = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, sort, select, ...rest } = req.query as any;
    const academicYears = await this.academicYearService.getAllAcademicYears(rest, { page, limit, sort, select });

    res.status(200).json({
      success: true,
      data: academicYears,
    });
  });

  getAcademicYearById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicYear = await this.academicYearService.getAcademicYearById(req.params.id);

    res.status(200).json({
      success: true,
      data: academicYear,
    });
  });

  getCurrentAcademicYear = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const currentAcademicYear = await this.academicYearService.getCurrentAcademicYear();

    res.status(200).json({
      success: true,
      data: currentAcademicYear,
    });
  });

  createAcademicYear = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicYearData: IAcademicYearCreateDTO = req.body;
    const academicYear = await this.academicYearService.createAcademicYear(academicYearData);

    res.status(201).json({
      success: true,
      data: academicYear,
    });
  });

  updateAcademicYear = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const academicYearData: IAcademicYearUpdateDTO = {
      id: req.params.id,
      ...req.body,
    };

    const academicYear = await this.academicYearService.updateAcademicYear(req.params.id, academicYearData);

    res.status(200).json({
      success: true,
      data: academicYear,
    });
  });

  deleteAcademicYear = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.academicYearService.deleteAcademicYear(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  });
}
