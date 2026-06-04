import { Router } from 'express';

import {

  getAdminStats,

  getAllUsers,

  toggleUserStatus,

  updateUserRole,

  getAllVisits,

  getAllScanLogs,

  approveVisitByAdmin,

  rejectVisitByAdmin

} from '../controllers/adminController';

import {

  authenticate,

  requireRole

} from '../middlewares/authMiddleware';


const router = Router();


// PROTECT ALL ADMIN ROUTES

router.use(authenticate);

router.use(requireRole('ADMIN'));


// DASHBOARD

router.get(

  '/stats',

  getAdminStats

);


// USERS

router.get(

  '/users',

  getAllUsers

);

router.patch(

  '/users/:id/status',

  toggleUserStatus

);

router.patch(

  '/users/:id/role',

  updateUserRole

);


// VISITS

router.get(

  '/visits',

  getAllVisits

);

router.patch(

  '/visits/:id/approve',

  approveVisitByAdmin

);

router.patch(

  '/requests/:id/approve',

  approveVisitByAdmin

);

router.patch(

  '/visits/:id/reject',

  rejectVisitByAdmin

);

router.patch(

  '/requests/:id/reject',

  rejectVisitByAdmin

);


// SCAN LOGS

router.get(

  '/logs',

  getAllScanLogs

);


export default router;
