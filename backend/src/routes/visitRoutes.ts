import { Router } from 'express';
import { createVisit, getMyVisits, getVisitById, cancelVisit, getHosts } from '../controllers/visitController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/hosts',           requireRole('GUEST'), getHosts);
router.post('/',               requireRole('GUEST'), createVisit);
router.get('/my',              requireRole('GUEST'), getMyVisits);
router.get('/:id',             requireRole('GUEST'), getVisitById);
router.delete('/:id',         requireRole('GUEST'), cancelVisit);

export default router;