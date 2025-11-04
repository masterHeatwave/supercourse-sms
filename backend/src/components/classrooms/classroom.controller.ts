import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { ClassroomService } from './classroom.service';
import { createClassroomSchema, updateClassroomSchema, queryClassroomSchema } from './classroom-validate.schema';
import { IClassroomCreateDTO, IClassroomUpdateDTO } from './classroom.interface';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Customer from '@components/customers/customer.model';

export class ClassroomController {
  private classroomService: ClassroomService;

  constructor() {
    this.classroomService = new ClassroomService();
  }

  getAllClassrooms = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryClassroomSchema.parse(req.query);
    const currentTenant = requestContextLocalStorage.getStore();

    let customerFilter = queryParams.customer;

    // If branch parameter is provided, use it directly (takes priority)
    if (queryParams.branch) {
      customerFilter = queryParams.branch;
    } else if (currentTenant) {
      // If no branch specified but we have tenant context, get all branch customers for this tenant
      const mainCustomer = await Customer.findOne({ slug: currentTenant, is_main_customer: true });
      if (mainCustomer) {
        // Find all branches that belong to this main customer
        const branchCustomers = await Customer.find({
          parent_customer: mainCustomer._id,
          is_main_customer: false,
        });

        // If we have branches, filter by all branch IDs
        if (branchCustomers.length > 0) {
          customerFilter = branchCustomers.map((branch) => branch._id.toString());
        }
      }
    }

    // Add customer filter based on tenant context or branch parameter
    const filters = {
      ...queryParams,
      customer: customerFilter,
    };

    const classrooms = await this.classroomService.getAllClassrooms(filters);

    // classrooms now is advancedResults response
    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: classrooms,
    });
  });

  getClassroomById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const currentTenant = requestContextLocalStorage.getStore();

    let customerFilter;
    if (currentTenant) {
      const mainCustomer = await Customer.findOne({ slug: currentTenant, is_main_customer: true });
      if (mainCustomer) {
        // Find all branches that belong to this main customer
        const branchCustomers = await Customer.find({
          parent_customer: mainCustomer._id,
          is_main_customer: false,
        });

        // If we have branches, filter by all branch IDs
        if (branchCustomers.length > 0) {
          customerFilter = branchCustomers.map((branch) => branch._id.toString());
        }
      }
    }

    const classroom = await this.classroomService.getClassroomById(req.params.id, customerFilter);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: classroom,
    });
  });

  createClassroom = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const currentTenant = requestContextLocalStorage.getStore();

    const customerValue = req.body.customer;

    // If customer is not provided in request body but we have tenant context,
    // validate that the provided customer belongs to this tenant
    if (currentTenant && customerValue) {
      const mainCustomer = await Customer.findOne({ slug: currentTenant, is_main_customer: true });
      if (mainCustomer) {
        // Verify that the provided customer is a branch of this tenant
        const branchCustomer = await Customer.findOne({
          _id: customerValue,
          parent_customer: mainCustomer._id,
          is_main_customer: false,
        });

        if (!branchCustomer) {
          return jsonResponse(res, {
            status: StatusCodes.BAD_REQUEST,
            success: false,
            message: 'Invalid customer/branch ID for this tenant',
          });
        }
      }
    }

    const classroomData: IClassroomCreateDTO = createClassroomSchema.parse({
      ...req.body,
      customer: customerValue,
    });

    const classroom = await this.classroomService.createClassroom(classroomData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: classroom,
    });
  });

  updateClassroom = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const classroomData: IClassroomUpdateDTO = updateClassroomSchema.parse({
      id: req.params.id,
      ...req.body,
    });

    const classroom = await this.classroomService.updateClassroom(req.params.id, classroomData);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: classroom,
    });
  });

  deleteClassroom = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.classroomService.deleteClassroom(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {},
      message: 'Classroom successfully deleted',
    });
  });
}
