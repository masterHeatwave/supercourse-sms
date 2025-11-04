import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { InternalService } from './internal.service';
import { IInternalSchoolCreateDTO, IBranchCreateDTO } from './user.interface';
import { internalCreateSchoolSchema, internalCreateBranchSchema } from './users-validate.schemas';

export class InternalController {
  private internalService: InternalService;

  constructor() {
    this.internalService = new InternalService();
  }

  createSchool = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const schoolData: IInternalSchoolCreateDTO = internalCreateSchoolSchema.parse(req.body);

    const { mainCustomer, branchCustomer, user } = await this.internalService.createSchool(schoolData);

    res.status(201).json({
      success: true,
      message: 'School, branch, and user created successfully',
      data: {
        mainCustomer,
        branchCustomer,
        user,
      },
    });
  });

  createBranch = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const branchData: IBranchCreateDTO = internalCreateBranchSchema.parse(req.body);

    const { branchCustomer } = await this.internalService.createBranch(branchData);

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: {
        branchCustomer,
      },
    });
  });
}
