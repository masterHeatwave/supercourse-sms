import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { MaterialsService } from './materials.service';

export class MaterialsController {
  private materialsService: MaterialsService;

  constructor() {
    this.materialsService = new MaterialsService();
  }

  getAssignedMaterials = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user;
    const customer = (req as any).customer;
    const customerSlug = (req as any).customerSlug;

    console.log('Materials API - Auth Debug:', {
      hasUser: !!user,
      hasCustomer: !!customer,
      customerSlug: customerSlug,
      customerId: customer?.id || customer?._id,
      userKeys: user ? Object.keys(user) : 'no user',
      customerKeys: customer ? Object.keys(customer) : 'no customer',
      headers: {
        'x-ss-auth': req.headers['x-ss-auth'],
        'x-customer-id': req.headers['x-customer-id'],
        'x-customer-slug': req.headers['x-customer-slug'],
        authorization: req.headers['authorization'],
      },
    });

    // Use customer ID from the x-customer-id header (which should be the branch ID)
    const headerCustomerId = req.headers['x-customer-id'] as string;
    const currentCustomerId = headerCustomerId || customer?.id || customer?._id;

    if (!currentCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No customer context found. Please ensure you are logged in with a customer context.',
      });
    }

    const materials = await this.materialsService.getAssignedMaterials(currentCustomerId);

    res.status(200).json({
      success: true,
      data: materials,
      count: materials.length,
    });
  });

  getMaterialsForTaxi = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const taxiId = req.params.taxiId;

    if (!taxiId) {
      return res.status(400).json({
        success: false,
        message: 'Taxi ID is required',
      });
    }

    const materials = await this.materialsService.getMaterialsForTaxi(taxiId);

    res.status(200).json({
      success: true,
      data: materials,
      count: materials.length,
    });
  });
}
