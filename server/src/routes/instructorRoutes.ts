import { Router } from 'express';
import {
  checkInstructorName,
  createInstructor,
  listInstructors,
  updateInstructor,
  deleteInstructor,
} from '../controllers/instructorController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/check-name', checkInstructorName);
router.post('/', createInstructor);
router.get('/list', listInstructors);
router.put('/:instructorId', requireRole('manager'), updateInstructor);
router.delete('/:instructorId', requireRole('manager'), deleteInstructor);

export default router;
