import { Router } from 'express';
import { getHostRequests, approveVisit, rejectVisit, getHostDashboard } from '../controllers/hostController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticate, requireRole('HOST'));

router.get('/dashboard',              getHostDashboard);
router.get('/requests',               getHostRequests);
router.patch('/requests/:id/approve', approveVisit);
router.patch('/requests/:id/reject',  rejectVisit);

export default router;
