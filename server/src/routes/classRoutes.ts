import { Router } from 'express';
import {
  checkClassConflict,
  createClass,
  listClasses,
  listMyClasses,
  updateClass,
  deleteClass,
} from '../controllers/classController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/check-conflict', checkClassConflict);
router.post('/', createClass);
router.get('/list', listClasses);
router.get('/mine', requireRole('instructor'), listMyClasses);
router.put('/:id', requireRole('manager'), updateClass);
router.delete('/:id', requireRole('manager'), deleteClass);

export default router;