import { Router } from 'express';
import { requireRole } from '../middleware/authMiddleware';
import {
  packageSalesReport,
  instructorsReport,
  customersReport,
  teacherPaymentsReport,
} from '../controllers/reportController';

const router = Router();

router.get('/package-sales', requireRole('manager'), packageSalesReport);
router.get('/instructors', requireRole('manager'), instructorsReport);
router.get('/customers', requireRole('manager'), customersReport);
router.get('/teacher-payments', requireRole('manager'), teacherPaymentsReport);

export default router;
