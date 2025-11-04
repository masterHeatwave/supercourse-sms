import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { InventoryService } from './inventory.service';
import { createInventorySchema, updateInventorySchema, queryInventorySchema } from './inventory-validate.schema';
import { IInventoryCreateDTO, IInventoryUpdateDTO } from './inventory.interface';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  getAllInventoryItems = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryInventorySchema.parse(req.query);
    const inventoryItems = await this.inventoryService.getAllInventoryItems(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: inventoryItems.length,
      data: inventoryItems,
    });
  });

  getInventoryItemById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const inventoryItem = await this.inventoryService.getInventoryItemById(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: inventoryItem,
    });
  });

  createInventoryItem = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const inventoryData: IInventoryCreateDTO = createInventorySchema.parse(req.body);
    const inventoryItem = await this.inventoryService.createInventoryItem(inventoryData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: inventoryItem,
    });
  });

  updateInventoryItem = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const inventoryData: IInventoryUpdateDTO = updateInventorySchema.parse({
      id: req.params.id,
      ...req.body,
    });

    const inventoryItem = await this.inventoryService.updateInventoryItem(req.params.id, inventoryData);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: inventoryItem,
    });
  });

  deleteInventoryItem = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.inventoryService.deleteInventoryItem(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {},
      message: 'Inventory item successfully deleted',
    });
  });

  markAsReturned = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const inventoryItem = await this.inventoryService.markAsReturned(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: inventoryItem,
      message: 'Inventory item marked as returned',
    });
  });
}
