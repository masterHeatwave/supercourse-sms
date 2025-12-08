import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { InternalService } from './internal.service';
import { IInternalSchoolCreateDTO, IBranchCreateDTO, ISetPrimaryBranchDTO } from './user.interface';
import {
  internalCreateSchoolSchema,
  internalCreateBranchSchema,
  internalSetPrimaryBranchSchema,
} from './users-validate.schemas';

export class InternalController {
  private internalService: InternalService;

  constructor() {
    this.internalService = new InternalService();
  }

  createSchool = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const schoolData: IInternalSchoolCreateDTO = internalCreateSchoolSchema.parse(req.body);

    const { mainCustomer, user } = await this.internalService.createSchool(schoolData);

    res.status(201).json({
      success: true,
      message: 'School and user created successfully',
      data: {
        mainCustomer,
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

  setPrimaryBranch = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const primaryBranchData: ISetPrimaryBranchDTO = internalSetPrimaryBranchSchema.parse(req.body);

    await this.internalService.setPrimaryBranch(primaryBranchData);

    res.status(200).json({
      success: true,
      message: 'Primary branch updated successfully',
    });
  });
}
