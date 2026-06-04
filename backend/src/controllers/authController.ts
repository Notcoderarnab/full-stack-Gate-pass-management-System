import { Request, Response } from 'express';

import bcrypt from 'bcryptjs';

import { z } from 'zod';

import { User } from '../models/User';

import { RefreshToken } from '../models/RefreshToken';

import {

  generateAccessToken,

  generateRefreshToken,

  verifyRefreshToken

} from '../services/tokenService';

import { AuthRequest } from '../middlewares/authMiddleware';


// ─────────────────────────────────────────────
// VALIDATION SCHEMA
// ─────────────────────────────────────────────

const registerSchema = z.object({

  name: z.string().min(
    2,
    'Name must be at least 2 characters'
  ),

  email: z.string().email(
    'Invalid email'
  ),

  password: z.string().min(
    8,
    'Password must be at least 8 characters'
  ),

  role: z.enum([
    'GUEST',
    'HOST',
    'GUARD'
  ]).default('GUEST'),

  phone: z.string().optional(),

  department: z.string().optional(),

});


// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

export const register = async (

  req: Request,

  res: Response

) => {

  try {

    const parsed = registerSchema.safeParse(
      req.body
    );

    if (!parsed.success) {

      return res.status(400).json({

        success: false,

        errors: parsed.error.flatten()

      });

    }

    const {

      name,
      email,
      password,
      role,
      phone,
      department

    } = parsed.data;


    // CHECK EXISTING USER

    const existing = await User.findOne({
      email
    });

    if (existing) {

      return res.status(409).json({

        success: false,

        message: 'Email already registered'

      });

    }


    // HASH PASSWORD

    const passwordHash = await bcrypt.hash(
      password,
      12
    );


    // CREATE USER

    const user = await User.create({

      name,

      email,

      passwordHash,

      role,

      phone,

      department

    });


    // GENERATE TOKENS

    const accessToken = generateAccessToken({

      id: user._id.toString(),

      email: user.email,

      role: user.role

    });

    const refreshToken = generateRefreshToken(
      user._id.toString()
    );


    // SAVE REFRESH TOKEN

    await RefreshToken.create({

      userId: user._id,

      token: refreshToken,

      expiresAt: new Date(

        Date.now() +
        7 * 24 * 60 * 60 * 1000

      ),

    });


    // SET COOKIE

    res.cookie(

      'refreshToken',

      refreshToken,

      {

        httpOnly: true,

        secure:
          process.env.NODE_ENV === 'production',

        sameSite: 'strict',

        maxAge:
          7 * 24 * 60 * 60 * 1000,

      }

    );


    return res.status(201).json({

      success: true,

      accessToken,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

      },

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message: 'Registration failed'

    });

  }

};


// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export const login = async (

  req: Request,

  res: Response

) => {

  try {

    const {

      email,
      password

    } = req.body;


    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message:
          'Email and password required'

      });

    }


    const user = await User.findOne({
      email
    });


    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'Invalid credentials'

      });

    }


    if (!user.isActive) {

      return res.status(403).json({

        success: false,

        message:
          'Account is deactivated'

      });

    }


    // CHECK PASSWORD

    const isMatch = await bcrypt.compare(

      password,

      user.passwordHash

    );


    if (!isMatch) {

      return res.status(401).json({

        success: false,

        message: 'Invalid credentials'

      });

    }


    // GENERATE TOKENS

    const accessToken = generateAccessToken({

      id: user._id.toString(),

      email: user.email,

      role: user.role

    });

    const refreshToken = generateRefreshToken(
      user._id.toString()
    );


    // SAVE REFRESH TOKEN

    await RefreshToken.create({

      userId: user._id,

      token: refreshToken,

      expiresAt: new Date(

        Date.now() +
        7 * 24 * 60 * 60 * 1000

      ),

    });


    // COOKIE

    res.cookie(

      'refreshToken',

      refreshToken,

      {

        httpOnly: true,

        secure:
          process.env.NODE_ENV === 'production',

        sameSite: 'strict',

        maxAge:
          7 * 24 * 60 * 60 * 1000,

      }

    );


    return res.json({

      success: true,

      accessToken,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role

      }

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message: 'Login failed'

    });

  }

};


// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export const logout = async (

  req: Request,

  res: Response

) => {

  try {

    const {

      refreshToken

    } = req.cookies;


    if (refreshToken) {

      await RefreshToken.deleteMany({

        token: refreshToken

      });

    }


    res.clearCookie(
      'refreshToken',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      }
    );


    return res.json({

      success: true,

      message:
        'Logged out successfully'

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message: 'Logout failed'

    });

  }

};


// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

export const refresh = async (

  req: Request,

  res: Response

) => {

  try {

    const {

      refreshToken

    } = req.cookies;


    if (!refreshToken) {

      return res.status(401).json({

        success: false,

        message: 'No refresh token'

      });

    }


    const tokenRecord =
      await RefreshToken.findOne({

        token: refreshToken

      });


    if (

      !tokenRecord ||

      tokenRecord.expiresAt < new Date()

    ) {

      return res.status(401).json({

        success: false,

        message:
          'Refresh token expired or invalid'

      });

    }


    let payload: { userId: string };


    try {

      payload =
        verifyRefreshToken(refreshToken);

    } catch {

      return res.status(401).json({

        success: false,

        message: 'Invalid refresh token'

      });

    }


    const user = await User.findById(
      payload.userId
    );


    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'User not found'

      });

    }


    const newAccessToken =
      generateAccessToken({

        id: user._id.toString(),

        email: user.email,

        role: user.role

      });


    return res.json({

      success: true,

      accessToken: newAccessToken

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Token refresh failed'

    });

  }

};


// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────

export const getMe = async (

  req: AuthRequest,

  res: Response

) => {

  try {

    const user = await User.findById(
      req.user!.id
    ).select('-passwordHash');


    if (!user) {

      return res.status(404).json({

        success: false,

        message: 'User not found'

      });

    }


    return res.json({

      success: true,

      user

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch user'

    });

  }

};
