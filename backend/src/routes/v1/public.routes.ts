import express, { Request, Response, NextFunction } from 'express';
import { CustomerService } from '@components/customers/customer.service';
import { asyncHandler } from '@middleware/async';

const router = express.Router();
const customerService = new CustomerService();

/**
 * @route   GET /v1/public/customers
 * @desc    Get all main customers (schools) - public endpoint
 * @access  Public
 */
router.get(
  '/customers',
  asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const customers = await customerService.getMainCustomersPublic();

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  })
);

export default router;
