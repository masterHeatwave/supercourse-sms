import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import AcademicSubperiodSchema from './academic-subperiods.model';
import {
  IAcademicSubperiod,
  IAcademicSubperiodCreateDTO,
  IAcademicSubperiodUpdateDTO,
} from './academic-subperiods.interface';
import AcademicPeriodSchema from './academic-periods.model';

export class AcademicSubperiodService {
  async getAllAcademicSubperiods(filters: { academic_period?: string; current?: string } = {}) {
    let query = AcademicSubperiodSchema.find().populate('academic_period').sort({ start_date: 1 });

    if (filters.academic_period) {
      query = query.where('academic_period', filters.academic_period);
    }

    if (filters.current === 'true') {
      const today = new Date();
      query = query
        .where('start_date')
        .lte(today as any)
        .where('end_date')
        .gte(today as any);
    }

    return await query.exec();
  }

  async getAcademicSubperiodById(id: string) {
    const academicSubperiod = await AcademicSubperiodSchema.findById(id).populate({
      path: 'academic_period',
      populate: { path: 'academic_year' },
    });

    if (!academicSubperiod) {
      throw new ErrorResponse('Academic subperiod not found', StatusCodes.NOT_FOUND);
    }

    return academicSubperiod;
  }

  async getCurrentAcademicSubperiod() {
    const today = new Date();
    const currentSubperiod = await AcademicSubperiodSchema.findOne({
      start_date: { $lte: today },
      end_date: { $gte: today },
    }).populate({
      path: 'academic_period',
      populate: { path: 'academic_year' },
    });

    if (!currentSubperiod) {
      throw new ErrorResponse('No current academic subperiod found', StatusCodes.NOT_FOUND);
    }

    return currentSubperiod;
  }

  async createAcademicSubperiod(academicSubperiodData: IAcademicSubperiodCreateDTO) {
    const academicPeriod = await AcademicPeriodSchema.findById(academicSubperiodData.academic_period);
    if (!academicPeriod) {
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    if (
      academicSubperiodData.start_date < academicPeriod.start_date ||
      academicSubperiodData.end_date > academicPeriod.end_date
    ) {
      throw new ErrorResponse('Subperiod dates must be within the academic period dates', StatusCodes.BAD_REQUEST);
    }

    const overlappingSubperiod = await this.checkForOverlappingSubperiods(
      academicSubperiodData.start_date,
      academicSubperiodData.end_date,
      academicSubperiodData.academic_period
    );

    if (overlappingSubperiod) {
      throw new ErrorResponse(
        `This subperiod overlaps with existing subperiod: ${overlappingSubperiod.name}`,
        StatusCodes.BAD_REQUEST
      );
    }

    const academicSubperiod = await AcademicSubperiodSchema.create(academicSubperiodData);
    return academicSubperiod;
  }

  async updateAcademicSubperiod(id: string, academicSubperiodData: IAcademicSubperiodUpdateDTO) {
    let academicSubperiod = await AcademicSubperiodSchema.findById(id);

    if (!academicSubperiod) {
      throw new ErrorResponse('Academic subperiod not found', StatusCodes.NOT_FOUND);
    }

    if (academicSubperiodData.start_date || academicSubperiodData.end_date || academicSubperiodData.academic_period) {
      const startDate = academicSubperiodData.start_date || academicSubperiod.start_date;
      const endDate = academicSubperiodData.end_date || academicSubperiod.end_date;
      const academicPeriodId = academicSubperiodData.academic_period || academicSubperiod.academic_period.toString();

      const academicPeriod = await AcademicPeriodSchema.findById(academicPeriodId);
      if (!academicPeriod) {
        throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
      }

      if (startDate < academicPeriod.start_date || endDate > academicPeriod.end_date) {
        throw new ErrorResponse('Subperiod dates must be within the academic period dates', StatusCodes.BAD_REQUEST);
      }

      const overlappingSubperiod = await this.checkForOverlappingSubperiods(startDate, endDate, academicPeriodId, id);

      if (overlappingSubperiod) {
        throw new ErrorResponse(
          `This subperiod would overlap with existing subperiod: ${overlappingSubperiod.name}`,
          StatusCodes.BAD_REQUEST
        );
      }
    }

    academicSubperiod = await AcademicSubperiodSchema.findByIdAndUpdate(id, academicSubperiodData, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'academic_period',
      populate: { path: 'academic_year' },
    });

    return academicSubperiod;
  }

  async deleteAcademicSubperiod(id: string) {
    const academicSubperiod = await AcademicSubperiodSchema.findById(id);

    if (!academicSubperiod) {
      throw new ErrorResponse('Academic subperiod not found', StatusCodes.NOT_FOUND);
    }

    const hasAssociatedData = await this.checkForAssociatedData(id);
    if (hasAssociatedData) {
      throw new ErrorResponse('Cannot delete academic subperiod with associated sessions', StatusCodes.BAD_REQUEST);
    }

    await academicSubperiod.deleteOne();
    return null;
  }

  private async checkForOverlappingSubperiods(
    startDate: Date,
    endDate: Date,
    academicPeriodId: string,
    excludeSubperiodId?: string
  ): Promise<IAcademicSubperiod | null> {
    const query: any = {
      academic_period: academicPeriodId,
      $or: [
        {
          start_date: { $lte: startDate },
          end_date: { $gte: startDate },
        },
        {
          start_date: { $lte: endDate },
          end_date: { $gte: endDate },
        },
        {
          start_date: { $gte: startDate },
          end_date: { $lte: endDate },
        },
      ],
    };

    if (excludeSubperiodId) {
      query._id = { $ne: excludeSubperiodId };
    }

    return await AcademicSubperiodSchema.findOne(query);
  }

  private async checkForAssociatedData(subperiodId: string): Promise<boolean> {
    return false;
  }
}
