import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { CustomerService } from './customer.service';
import { ICustomerCreateDTO, ICustomerUpdateDTO } from './customer.interface';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  getMainCustomer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customer = await this.customerService.getMainCustomer();

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  getAllCustomers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customers = await this.customerService.getAllCustomers();

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  });

  getCustomerById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customer = await this.customerService.getCustomerById(req.params.id);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  getCustomerBySlug = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customer = await this.customerService.getCustomerBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  createCustomer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customerData: ICustomerCreateDTO = req.body;
    const customer = await this.customerService.createCustomer(customerData);

    res.status(201).json({
      success: true,
      data: customer,
    });
  });

  updateCustomer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customerData: ICustomerUpdateDTO = {
      id: req.params.id,
      ...req.body,
    };

    const customer = await this.customerService.updateCustomer(req.params.id, customerData);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  updateMainCustomer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customerData: ICustomerUpdateDTO = req.body;
    const customer = await this.customerService.updateMainCustomer(customerData);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  deleteCustomer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.customerService.deleteCustomer(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  });

  setAdministrator = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { userId } = req.body;
    const customer = await this.customerService.setAdministrator(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  setManager = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { userId } = req.body;
    const customer = await this.customerService.setManager(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  getCustomersByType = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const customers = await this.customerService.getCustomersByType(req.params.type as any);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  });
}
