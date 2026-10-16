import { Router } from 'express';
import { createPackage, listPackages, updatePackage, deletePackage } from '../controllers/packageController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/list', listPackages);
router.post('/', createPackage);
router.put('/:packageId', requireRole('manager'), updatePackage);
router.delete('/:packageId', requireRole('manager'), deletePackage);

export default router;
