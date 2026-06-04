"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.refresh = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const RefreshToken_1 = require("../models/RefreshToken");
const tokenService_1 = require("../services/tokenService");
// ─────────────────────────────────────────────
// VALIDATION SCHEMA
// ─────────────────────────────────────────────
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: zod_1.z.enum([
        'GUEST',
        'HOST',
        'GUARD'
    ]).default('GUEST'),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
});
// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                errors: parsed.error.flatten()
            });
        }
        const { name, email, password, role, phone, department } = parsed.data;
        // CHECK EXISTING USER
        const existing = await User_1.User.findOne({
            email
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }
        // HASH PASSWORD
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // CREATE USER
        const user = await User_1.User.create({
            name,
            email,
            passwordHash,
            role,
            phone,
            department
        });
        // GENERATE TOKENS
        const accessToken = (0, tokenService_1.generateAccessToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role
        });
        const refreshToken = (0, tokenService_1.generateRefreshToken)(user._id.toString());
        // SAVE REFRESH TOKEN
        await RefreshToken_1.RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() +
                7 * 24 * 60 * 60 * 1000),
        });
        // SET COOKIE
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};
exports.register = register;
// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password required'
            });
        }
        const user = await User_1.User.findOne({
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
                message: 'Account is deactivated'
            });
        }
        // CHECK PASSWORD
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // GENERATE TOKENS
        const accessToken = (0, tokenService_1.generateAccessToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role
        });
        const refreshToken = (0, tokenService_1.generateRefreshToken)(user._id.toString());
        // SAVE REFRESH TOKEN
        await RefreshToken_1.RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() +
                7 * 24 * 60 * 60 * 1000),
        });
        // COOKIE
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};
exports.login = login;
// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await RefreshToken_1.RefreshToken.deleteMany({
                token: refreshToken
            });
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};
exports.logout = logout;
// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token'
            });
        }
        const tokenRecord = await RefreshToken_1.RefreshToken.findOne({
            token: refreshToken
        });
        if (!tokenRecord ||
            tokenRecord.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired or invalid'
            });
        }
        let payload;
        try {
            payload =
                (0, tokenService_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        const user = await User_1.User.findById(payload.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        const newAccessToken = (0, tokenService_1.generateAccessToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role
        });
        return res.json({
            success: true,
            accessToken: newAccessToken
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};
exports.refresh = refresh;
// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.id).select('-passwordHash');
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
};
exports.getMe = getMe;
