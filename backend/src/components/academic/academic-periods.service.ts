import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import AcademicPeriodSchema from './academic-periods.model';
import { IAcademicPeriod, IAcademicPeriodCreateDTO, IAcademicPeriodUpdateDTO } from './academic-periods.interface';
import AcademicYearSchema from './academic-years.model';

export class AcademicPeriodService {
  async getAllAcademicPeriods(filters: { academic_year?: string; current?: string } = {}) {
    let query = AcademicPeriodSchema.find().sort({ start_date: 1 });

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

    let results = await query.exec();
    // Manually populate academic_year to work around tenant-aware plugin issues
    // Populate academic years
    results = await Promise.all(
      results.map(async (period: any) => {
        if (period.academic_year) {
          try {
            const year = await AcademicYearSchema.findById(period.academic_year);
            period.academic_year = year;
          } catch (error) {
            console.warn('[AcademicPeriodService] Failed to populate academic year:', error);
          }
        }
        return period;
      })
    );

    return results;
  }

  async getAcademicPeriodById(id: string) {
    let academicPeriod = await AcademicPeriodSchema.findById(id);

    if (!academicPeriod) {
      throw new ErrorResponse('Academic period not found', StatusCodes.NOT_FOUND);
    }

    // Manually populate academic_year to work around tenant-aware plugin issues
    if (academicPeriod.academic_year) {
      try {
        const year = await AcademicYearSchema.findById(academicPeriod.academic_year);
        academicPeriod.academic_year = year;
      } catch (error) {
        console.warn('[AcademicPeriodService] Failed to populate academic year:', error);
      }
    }

    console.log('[AcademicPeriodService] getAcademicPeriodById:', {
      id: academicPeriod._id,
      name: academicPeriod.name,
      academic_year: academicPeriod.academic_year ? 'POPULATED' : null,
    });

    return academicPeriod;
  }

  async getCurrentAcademicPeriod() {
    const today = new Date();
    let currentPeriod = await AcademicPeriodSchema.findOne({
      start_date: { $lte: today },
      end_date: { $gte: today },
    });

    if (!currentPeriod) {
      throw new ErrorResponse('No current academic period found', StatusCodes.NOT_FOUND);
    }

    // Manually populate academic_year to work around tenant-aware plugin issues
    if (currentPeriod.academic_year) {
      try {
        const year = await AcademicYearSchema.findById(currentPeriod.academic_year);
        currentPeriod.academic_year = year;
      } catch (error) {
        console.warn('[AcademicPeriodService] Failed to populate academic year:', error);
      }
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

    let academicPeriod = await AcademicPeriodSchema.create(academicPeriodData);

    // Verify the academic_year reference was stored
    console.log('[AcademicPeriodService] Created period:', {
      id: academicPeriod._id,
      name: academicPeriod.name,
      academic_year_ref: academicPeriod.academic_year,
      academic_year_type: typeof academicPeriod.academic_year,
    });

    // Manually populate academic_year to work around tenant-aware plugin issues
    if (academicPeriod.academic_year) {
      try {
        const year = await AcademicYearSchema.findById(academicPeriod.academic_year);
        academicPeriod.academic_year = year;
      } catch (error) {
        console.warn('[AcademicPeriodService] Failed to populate academic year:', error);
      }
    }

    console.log('[AcademicPeriodService] Created and populated period:', {
      id: academicPeriod._id,
      name: academicPeriod.name,
      academic_year: academicPeriod.academic_year ? 'POPULATED' : null,
    });

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
