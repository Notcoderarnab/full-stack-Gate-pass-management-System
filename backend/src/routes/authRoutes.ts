import { Router } from 'express';

import {

  register,

  login,

  logout,

  refresh,

  getMe

} from '../controllers/authController';

import {

  authenticate

} from '../middlewares/authMiddleware';


const router = Router();


// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

router.post(

  '/register',

  register

);

router.post(

  '/login',

  login

);

router.post(

  '/logout',

  logout

);

router.post(

  '/refresh',

  refresh

);

router.get(

  '/me',

  authenticate,

  getMe

);


export default router;
