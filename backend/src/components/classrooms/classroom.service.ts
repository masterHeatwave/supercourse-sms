import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import Classroom from './classroom.model';
import Customer from '@components/customers/customer.model';
import { IClassroomCreateDTO, IClassroomUpdateDTO } from './classroom.interface';

export class ClassroomService {
  async getAllClassrooms(
    filters: {
      search?: string;
      location?: string;
      equipment?: string;
      minCapacity?: string;
      available_day?: string;
      available_time?: string;
      customer?: string | string[];
      branch?: string;
      page?: string;
      limit?: string;
      sort?: string;
      select?: string;
    } = {}
  ) {
    const overrides: Record<string, unknown> = {};

    // Filter by customer if provided
    if (filters.customer) {
      if (Array.isArray(filters.customer)) {
        overrides.customer = { $in: filters.customer } as any;
      } else {
        overrides.customer = filters.customer;
      }
    }

    // Handle branch filter (alias for customer filter)
    if (filters.branch !== undefined && filters.branch.trim() !== '') {
      overrides.customer = filters.branch;
    }

    if (filters.search) {
      (overrides as any).$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.location) {
      (overrides as any).location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.equipment) {
      (overrides as any).equipment = { $regex: filters.equipment, $options: 'i' };
    }

    if (filters.minCapacity) {
      const capacity = parseInt(filters.minCapacity);
      if (!isNaN(capacity)) {
        (overrides as any).capacity = { $gte: capacity };
      }
    }

    // Filter by availability status
    if (filters.available_day) {
      // For backward compatibility, we'll interpret available_day as availability status
      // This can be 'available', 'unavailable', 'out_of_order', or 'under_maintenance'
      (overrides as any).availability = filters.available_day;
    }

    return await Classroom.advancedResults({
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort ?? 'name',
      select: filters.select,
      populate: [
        {
          path: 'customer',
          model: Customer,
        },
        {
          path: 'sessions',
          populate: [{ path: 'academic_period' }, { path: 'taxi' }],
        },
      ],
      overrides,
    });
  }

  async getClassroomById(id: string, customer?: string | string[]) {
    let query = Classroom.findById(id);

    // Filter by customer if provided
    if (customer) {
      if (Array.isArray(customer)) {
        query = query.where({ customer: { $in: customer } });
      } else {
        query = query.where({ customer });
      }
    }

    const classroom = await query.populate([
      {
        path: 'customer',
        select: 'name slug email phone address',
        model: Customer,
      },
      {
        path: 'sessions',
        populate: [
          { path: 'academic_period', select: 'name' },
          { path: 'taxi', select: 'name' },
          { path: 'students', select: 'name email phone' },
          { path: 'teachers', select: 'name email phone position' },
        ],
      },
    ]);

    if (!classroom) {
      throw new ErrorResponse('Classroom not found', StatusCodes.NOT_FOUND);
    }

    return classroom;
  }

  async createClassroom(classroomData: IClassroomCreateDTO) {
    const classroom = await Classroom.create(classroomData);
    return await this.getClassroomById((classroom._id as any).toString(), classroomData.customer); // Convert _id
  }

  async updateClassroom(id: string, classroomData: IClassroomUpdateDTO) {
    const classroomDoc = await Classroom.findById(id);
    if (!classroomDoc) {
      throw new ErrorResponse('Classroom not found', StatusCodes.NOT_FOUND);
    }
    const updatedClassroom = await Classroom.findByIdAndUpdate(id, classroomData, {
      new: true,
      runValidators: true,
    });
    const classroomId = updatedClassroom?._id ? (updatedClassroom._id as any).toString() : id;
    return await this.getClassroomById(
      classroomId,
      classroomData.customer || (classroomDoc.customer as any).toString()
    );
  }

  async deleteClassroom(id: string) {
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      throw new ErrorResponse('Classroom not found', StatusCodes.NOT_FOUND);
    }
    await classroom.deleteOne();
    return null;
  }
}
