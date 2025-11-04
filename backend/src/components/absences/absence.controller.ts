import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import AbsenceService from './absence.service';
import { absenceCreateSchema, absenceUpdateSchema, absenceReportSchema } from './absence-validate.schema';
import { IAbsenceCreateDTO, IAbsenceUpdateDTO, IAbsenceReportParams } from './absence.interface';

class AbsenceController {
  getAbsences = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await AbsenceService.getAbsences(req.query);
    res.status(200).json(result);
  });

  getAbsence = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const absence = await AbsenceService.getAbsence(req.params.id);
    res.status(200).json({ success: true, data: absence });
  });

  createAbsence = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsedData = absenceCreateSchema.parse(req.body);
    // Convert string date to Date object
    const absenceData: IAbsenceCreateDTO = {
      ...parsedData,
      date: parsedData.date instanceof Date ? parsedData.date : new Date(parsedData.date),
      notification_date: parsedData.notification_date
        ? parsedData.notification_date instanceof Date
          ? parsedData.notification_date
          : new Date(parsedData.notification_date)
        : undefined,
    };

    const absence = await AbsenceService.createAbsence(absenceData);
    res.status(201).json({ success: true, data: absence });
  });

  updateAbsence = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsedData = absenceUpdateSchema.parse(req.body);
    // Convert string date to Date object
    const absenceData: IAbsenceUpdateDTO = {
      ...parsedData,
      date: parsedData.date
        ? parsedData.date instanceof Date
          ? parsedData.date
          : new Date(parsedData.date)
        : undefined,
      notification_date: parsedData.notification_date
        ? parsedData.notification_date instanceof Date
          ? parsedData.notification_date
          : new Date(parsedData.notification_date)
        : undefined,
    };

    const absence = await AbsenceService.updateAbsence(req.params.id, absenceData);
    res.status(200).json({ success: true, data: absence });
  });

  deleteAbsence = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await AbsenceService.deleteAbsence(req.params.id);
    res.status(200).json({ success: true, data: {} });
  });

  getAbsenceReport = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsedParams = absenceReportSchema.parse(req.query);
    // Convert string dates to Date objects
    const reportParams: IAbsenceReportParams = {
      ...parsedParams,
      start_date: parsedParams.start_date
        ? parsedParams.start_date instanceof Date
          ? parsedParams.start_date
          : new Date(parsedParams.start_date)
        : undefined,
      end_date: parsedParams.end_date
        ? parsedParams.end_date instanceof Date
          ? parsedParams.end_date
          : new Date(parsedParams.end_date)
        : undefined,
    };

    const report = await AbsenceService.getAbsenceReport(reportParams);
    res.status(200).json({ success: true, data: report });
  });

  notifyParent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const absence = await AbsenceService.notifyParent(req.params.id);
    res.status(200).json({ success: true, data: absence });
  });
}

export default new AbsenceController();
