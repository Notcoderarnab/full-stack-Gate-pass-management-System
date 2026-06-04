import { Router } from 'express';
import { scanQRCode, getScanLogs } from '../controllers/gaurdController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticate, requireRole('GUARD', 'ADMIN'));

router.post('/scan', scanQRCode);
router.get('/logs',  getScanLogs);

export default router;
