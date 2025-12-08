import { FilterQuery } from 'mongoose';
import AcademicYearModel from './academic-years.model';
import AcademicPeriodModel from './academic-periods.model';
import {
  IAcademicYear,
  IAcademicYearCreateDTO,
  IAcademicYearUpdateDTO,
  IAcademicYearStatus,
} from './academic-years.interface';
import { ErrorResponse } from '@utils/errorResponse';

export class AcademicYearService {
  async getAllAcademicYears(
    query: FilterQuery<IAcademicYear> = {},
    options: { page?: string; limit?: string; sort?: string; select?: string } = {}
  ) {
    return AcademicYearModel.advancedResults({
      page: options.page,
      limit: options.limit,
      sort: options.sort ?? 'start_date',
      select: options.select,
      overrides: query as any,
    });
  }

  async getAcademicYearById(id: string): Promise<IAcademicYear | null> {
    const academicYear = await AcademicYearModel.findById(id).populate('academic_periods');

    if (!academicYear) {
      throw new ErrorResponse('Academic year not found', 404);
    }

    return academicYear;
  }

  /**
   * Get the manually activated academic year from settings
   * This reflects the user's choice regardless of the current date
   */
  async getManualActiveAcademicYear(): Promise<IAcademicYear | null> {
    const academicYear = await AcademicYearModel.findOne({ is_manual_active: true });
    return academicYear || null;
  }

  /**
   * Get the academic year derived from the current date
   * Returns the year where today's date falls within its start_date and end_date range
   */
  async getDateDerivedAcademicYear(): Promise<IAcademicYear | null> {
    const currentDate = new Date();
    const academicYear = await AcademicYearModel.findOne({
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate },
    });

    return academicYear || null;
  }

  /**
   * Get both manual and date-derived academic year statuses
   * Returns an object containing both pieces of information
   */
  async getAcademicYearStatus(): Promise<IAcademicYearStatus> {
    const [manualActive, dateDerived] = await Promise.all([
      this.getManualActiveAcademicYear(),
      this.getDateDerivedAcademicYear(),
    ]);

    const areTheSame = manualActive && dateDerived && manualActive.id.toString() === dateDerived.id.toString();

    return {
      manual_active_academic_year: manualActive,
      date_current_academic_year: dateDerived,
      are_the_same: areTheSame || false,
    };
  }

  /**
   * Get the current academic year - prioritizes date-derived if available, falls back to manual
   * Kept for backwards compatibility
   */
  async getCurrentAcademicYear(): Promise<IAcademicYear | null> {
    // First try date-derived (calendar-based)
    const dateDerived = await this.getDateDerivedAcademicYear();
    if (dateDerived) {
      return dateDerived;
    }

    // Fall back to manually activated year
    const manualActive = await this.getManualActiveAcademicYear();
    if (manualActive) {
      return manualActive;
    }

    throw new ErrorResponse('No current academic year found', 404);
  }

  async createAcademicYear(academicYearData: IAcademicYearCreateDTO): Promise<IAcademicYear> {
    // Check if the date range overlaps with existing academic years
    const existingYear = await AcademicYearModel.findOne({
      $or: [
        {
          start_date: { $lte: academicYearData.start_date },
          end_date: { $gte: academicYearData.start_date },
        },
        {
          start_date: { $lte: academicYearData.end_date },
          end_date: { $gte: academicYearData.end_date },
        },
        {
          start_date: { $gte: academicYearData.start_date },
          end_date: { $lte: academicYearData.end_date },
        },
      ],
    });

    if (existingYear) {
      throw new ErrorResponse('Date range overlaps with an existing academic year', 400);
    }

    // Check if this academic year covers the current date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const startDate = new Date(academicYearData.start_date);
    const endDate = new Date(academicYearData.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const isCurrentActive = startDate <= currentDate && currentDate <= endDate;

    // Determine if this academic year should be manually active
    // Either if it's the current active year, or if explicitly set to true
    const shouldBeManualActive = isCurrentActive || academicYearData.is_manual_active === true;

    // If this should be manually active, set it as the only active year
    if (shouldBeManualActive) {
      const dataToCreate = {
        ...academicYearData,
        is_manual_active: true,
      };

      // Create the academic year first
      const academicYear = await AcademicYearModel.create(dataToCreate);

      // Toggle: Deactivate all other academic years (is_manual_active = false)
      // Only one academic year can be manually active at a time
      await AcademicYearModel.updateMany({ _id: { $ne: academicYear._id } }, { $set: { is_manual_active: false } });

      // Also update academic periods: deactivate periods from other years, activate for this year
      await AcademicPeriodModel.updateMany(
        { academic_year: { $ne: academicYear._id } },
        { $set: { is_active: false } }
      );
      await AcademicPeriodModel.updateMany({ academic_year: academicYear._id }, { $set: { is_active: true } });

      // Fetch the updated document to ensure we return the correct state
      const updatedAcademicYear = await AcademicYearModel.findById(academicYear._id);
      return updatedAcademicYear as IAcademicYear;
    }

    return AcademicYearModel.create(academicYearData);
  }

  async updateAcademicYear(id: string, academicYearData: IAcademicYearUpdateDTO): Promise<IAcademicYear | null> {
    // Check if the date range overlaps with existing academic years if dates are being updated
    if (academicYearData.start_date || academicYearData.end_date) {
      const currentYear = await AcademicYearModel.findById(id);
      if (!currentYear) {
        throw new ErrorResponse('Academic year not found', 404);
      }

      const startDate = academicYearData.start_date || currentYear.start_date;
      const endDate = academicYearData.end_date || currentYear.end_date;

      const existingYear = await AcademicYearModel.findOne({
        _id: { $ne: id },
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
      });

      if (existingYear) {
        throw new ErrorResponse('Date range overlaps with an existing academic year', 400);
      }
    }

    // If setting this academic year as manually active, deactivate others
    // Only one academic year can be manually active at a time
    if (academicYearData.is_manual_active === true) {
      await AcademicYearModel.updateMany({ _id: { $ne: id } }, { $set: { is_manual_active: false } });
      await AcademicPeriodModel.updateMany({ academic_year: { $ne: id } }, { $set: { is_active: false } });
      await AcademicPeriodModel.updateMany({ academic_year: id }, { $set: { is_active: true } });
    }

    const academicYear = await AcademicYearModel.findByIdAndUpdate(id, academicYearData, {
      new: true,
      runValidators: true,
    });

    if (!academicYear) {
      throw new ErrorResponse('Academic year not found', 404);
    }

    return academicYear;
  }

  async deleteAcademicYear(id: string): Promise<void> {
    const academicYear = await AcademicYearModel.findById(id);

    if (!academicYear) {
      throw new ErrorResponse('Academic year not found', 404);
    }

    await AcademicYearModel.deleteOne({ _id: id });
  }

  async getCurrentlySelectedAcademicYear(): Promise<IAcademicYear | null> {
    const academicYear = await AcademicYearModel.findOne({ is_manual_active: true });

    if (!academicYear) {
      throw new ErrorResponse('No currently selected academic year found', 404);
    }

    return academicYear;
  }
}
