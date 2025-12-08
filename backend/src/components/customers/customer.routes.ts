import express from 'express';
import { CustomerController } from './customer.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const customerController = new CustomerController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER]), customerController.getAllCustomers)
  .post(authorize([Role.ADMIN]), customerController.createCustomer);

router.get('/main', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customerController.getMainCustomer);

router.put('/main', authorize([Role.ADMIN]), customerController.updateMainCustomer);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER]), customerController.getCustomerById)
  .put(authorize([Role.ADMIN]), customerController.updateCustomer)
  .delete(authorize([Role.ADMIN]), customerController.deleteCustomer);

router.get('/slug/:slug', authorize([Role.ADMIN, Role.MANAGER]), customerController.getCustomerBySlug);

router.get('/type/:type', authorize([Role.ADMIN, Role.MANAGER]), customerController.getCustomersByType);

router.put('/:id/administrator', authorize([Role.ADMIN]), customerController.setAdministrator);

router.put('/:id/manager', authorize([Role.ADMIN]), customerController.setManager);

export default router;
