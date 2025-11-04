import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import AcademicPeriodSchema from './academic-periods.model';
import { IAcademicPeriod, IAcademicPeriodCreateDTO, IAcademicPeriodUpdateDTO } from './academic-periods.interface';
import AcademicYearSchema from './academic-years.model';

export class AcademicPeriodService {
  async getAllAcademicPeriods(filters: { academic_year?: string; current?: string } = {}) {
    let query = AcademicPeriodSchema.find().populate('academic_year').sort({ start_date: 1 });

    if (filters.academic_year) {
      query = query.where('academic_year', filters.academic_year);
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

  async getAcademicPeriodById(id: string) {
    const academicPeriod = await AcademicPeriodSchema.findById(id).populate('academic_year');

    if (!academicPeriod) {
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    return academicPeriod;
  }

  async getCurrentAcademicPeriod() {
    const today = new Date();
    const currentPeriod = await AcademicPeriodSchema.findOne({
      start_date: { $lte: today },
      end_date: { $gte: today },
    }).populate('academic_year');

    if (!currentPeriod) {
      throw new ErrorResponse('No current academic period found', StatusCodes.NOT_FOUND);
    }

    return currentPeriod;
  }

  async createAcademicPeriod(academicPeriodData: IAcademicPeriodCreateDTO) {
    const academicYear = await AcademicYearSchema.findById(academicPeriodData.academic_year);
    if (!academicYear) {
      throw new ErrorResponse('Academic year not found', StatusCodes.NOT_FOUND);
    }
    const overlappingPeriod = await this.checkForOverlappingPeriods(
      academicPeriodData.start_date,
      academicPeriodData.end_date,
      academicPeriodData.academic_year
    );

    if (overlappingPeriod) {
      throw new ErrorResponse(
        `This period overlaps with existing period: ${overlappingPeriod.name}`,
        StatusCodes.BAD_REQUEST
      );
    }

    const academicPeriod = await AcademicPeriodSchema.create(academicPeriodData);
    return academicPeriod;
  }

  async updateAcademicPeriod(id: string, academicPeriodData: IAcademicPeriodUpdateDTO) {
    let academicPeriod = await AcademicPeriodSchema.findById(id);

    if (!academicPeriod) {
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    // If updating dates or academic year, check for overlaps
    if (
      (academicPeriodData.start_date || academicPeriodData.end_date || academicPeriodData.academic_year) &&
      !(academicPeriodData.start_date && academicPeriodData.end_date && academicPeriodData.academic_year)
    ) {
      // Get the complete data for overlap check
      const startDate = academicPeriodData.start_date || academicPeriod.start_date;
      const endDate = academicPeriodData.end_date || academicPeriod.end_date;
      const academicYearId = academicPeriodData.academic_year || academicPeriod.academic_year.toString();

      const overlappingPeriod = await this.checkForOverlappingPeriods(startDate, endDate, academicYearId, id);

      if (overlappingPeriod) {
        throw new ErrorResponse(
          `This period would overlap with existing period: ${overlappingPeriod.name}`,
          StatusCodes.BAD_REQUEST
        );
      }
    }

    academicPeriod = await AcademicPeriodSchema.findByIdAndUpdate(id, academicPeriodData, {
      new: true,
      runValidators: true,
    }).populate('academic_year');

    return academicPeriod;
  }

  async deleteAcademicPeriod(id: string) {
    const academicPeriod = await AcademicPeriodSchema.findById(id);

    if (!academicPeriod) {
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    const hasAssociatedData = await this.checkForAssociatedData(id);
    if (hasAssociatedData) {
      throw new ErrorResponse(
        'Cannot delete academic period with associated subperiods or sessions',
        StatusCodes.BAD_REQUEST
      );
    }

    await academicPeriod.deleteOne();
    return null;
  }

  private async checkForOverlappingPeriods(
    startDate: Date,
    endDate: Date,
    academicYearId: string,
    excludePeriodId?: string
  ): Promise<IAcademicPeriod | null> {
    const query: any = {
      academic_year: academicYearId,
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

    if (excludePeriodId) {
      query._id = { $ne: excludePeriodId };
    }

    return await AcademicPeriodSchema.findOne(query);
  }

  private async checkForAssociatedData(periodId: string): Promise<boolean> {
    return false;
  }
}
