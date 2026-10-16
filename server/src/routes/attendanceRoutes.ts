import { Router } from 'express';
import { checkAttendanceSchedule, createAttendance, listMyAttendance } from '../controllers/attendanceController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/check-schedule', requireRole('instructor'), checkAttendanceSchedule);
router.post('/', requireRole('instructor'), createAttendance);
router.get('/mine', requireRole('instructor'), listMyAttendance);

export default router;
