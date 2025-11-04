import { FilterQuery } from 'mongoose';
import AcademicYearModel from './academic-years.model';
import { IAcademicYear, IAcademicYearCreateDTO, IAcademicYearUpdateDTO } from './academic-years.interface';
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

  async getCurrentAcademicYear(): Promise<IAcademicYear | null> {
    const currentDate = new Date();
    const academicYear = await AcademicYearModel.findOne({
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate },
    });

    if (!academicYear) {
      throw new ErrorResponse('No current academic year found', 404);
    }

    return academicYear;
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

    // If setting this academic year as active, first set all others to inactive
    // Only one academic year can be active at a time
    if (academicYearData.is_current === true) {
      await AcademicYearModel.updateMany({ _id: { $ne: id } }, { $set: { is_current: false } });
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
}
