import { Router } from 'express';
import { checkInstructorName, createInstructor,listInstructors } from '../controllers/instructorController';

const router = Router();

router.get('/check-name', checkInstructorName);
router.post('/', createInstructor);
router.get('/list', listInstructors);

export default router;
