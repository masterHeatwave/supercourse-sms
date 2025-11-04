import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { TaxiService } from './taxi.service';
import {
  createTaxiSchema,
  updateTaxiSchema,
  queryTaxiSchema,
  addUserSchema,
  removeUserSchema,
} from './taxi-validate.schema';
import { ITaxiCreateDTO, ITaxiUpdateDTO } from './taxi.interface';

export class TaxiController {
  private taxiService: TaxiService;

  constructor() {
    this.taxiService = new TaxiService();
  }

  getAllTaxis = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryTaxiSchema.parse(req.query);
    const taxis = await this.taxiService.getAllTaxis(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: taxis.length,
      data: taxis,
    });
  });

  getTaxiById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const taxi = await this.taxiService.getTaxiById(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: taxi,
    });
  });

  createTaxi = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const taxiData: ITaxiCreateDTO = createTaxiSchema.parse(req.body);
      const taxi = await this.taxiService.createTaxi(taxiData);
      jsonResponse(res, {
        status: StatusCodes.CREATED,
        success: true,
        data: taxi,
      });
    } catch (error) {
      console.error('Error in taxi creation:', error);
      throw error;
    }
  });

  updateTaxi = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const taxiData: ITaxiUpdateDTO = updateTaxiSchema.parse({
      id: req.params.id,
      ...req.body,
    });

    const taxi = await this.taxiService.updateTaxi(req.params.id, taxiData);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: taxi,
    });
  });

  deleteTaxi = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.taxiService.deleteTaxi(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {},
      message: 'Taxi successfully deleted',
    });
  });

  addUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { taxi_id, user_id } = addUserSchema.parse(req.body);
    const taxi = await this.taxiService.addUser(taxi_id, user_id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: taxi,
      message: 'User successfully added to taxi',
    });
  });

  removeUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { taxi_id, user_id } = removeUserSchema.parse(req.body);
    const taxi = await this.taxiService.removeUser(taxi_id, user_id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: taxi,
      message: 'User successfully removed from taxi',
    });
  });

  getTaxiAttendance = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const taxiId = req.params.id;
    const limitParam = req.query.limit as string | undefined;
    const maxDates = limitParam ? Math.max(1, Math.min(60, parseInt(limitParam))) : 10;

    const result = await this.taxiService.getTaxiAttendance(taxiId, maxDates);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: result,
    });
  });

  getTaxisByUserId = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.params.userId;
    const taxis = await this.taxiService.getTaxisByUserId(userId);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: taxis.length,
      data: taxis,
    });
  });

  /**
   * GET /v1/taxis/with-users
   * Get all taxis with populated user details
   */
  getAllTaxisWithUsers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const taxis = await this.taxiService.getAllTaxisWithUsers();

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: taxis.length,
      data: taxis,
    });
  });

  /**
   * GET /v1/taxis/:id/with-users
   * Get single taxi with populated user details
   */
  getTaxiByIdWithUsers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const taxi = await this.taxiService.getTaxiByIdWithUsers(id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: taxi,
    });
  });

  /**
   * GET /v1/taxis/messaging
   * Get taxis for messaging - lightweight endpoint for chat dialog
   * Returns classes with students and teachers separated for TreeNode building
   * Used by: new-chat-dialog.component.ts
   */
  getTaxisForMessaging = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const taxis = await this.taxiService.getTaxisForMessaging();

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: taxis.length,
      data: taxis,
    });
  });
}
