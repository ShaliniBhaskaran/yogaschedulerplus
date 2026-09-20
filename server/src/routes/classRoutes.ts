import { Router } from 'express';
import { checkClassConflict, createClass, listClasses } from '../controllers/classController';

const router = Router();

router.get('/check-conflict', checkClassConflict);
router.post('/', createClass);
router.get('/list', listClasses);

export default router;
