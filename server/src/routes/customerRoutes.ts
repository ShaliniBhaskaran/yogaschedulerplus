import { Router } from 'express';
import {
  checkCustomerName,
  createCustomer,
  listCustomers,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/check-name', checkCustomerName);
router.get('/list', listCustomers);
router.post('/', createCustomer);
router.put('/:customerId', requireRole('manager'), updateCustomer);
router.delete('/:customerId', requireRole('manager'), deleteCustomer);

export default router;
