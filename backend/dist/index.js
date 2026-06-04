"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
const connect_1 = require("./db/connect");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const visitRoutes_1 = __importDefault(require("./routes/visitRoutes"));
const hostRoutes_1 = __importDefault(require("./routes/hostRoutes"));
const guardRoutes_1 = __importDefault(require("./routes/guardRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const Visit_1 = require("./models/Visit");
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const seedAdmin_1 = require("./utils/seedAdmin");
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = new Set([
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
]);
// ── SECURITY MIDDLEWARES ───────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin ||
            allowedOrigins.has(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' })); // 10mb for base64 QR images
app.use((0, cookie_parser_1.default)());
// ── RATE LIMITING ──────────────────────────────────────────
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many login attempts, try again later' },
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
// ── ROUTES ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes_1.default);
app.use('/api/visits', visitRoutes_1.default);
app.use('/api/host', hostRoutes_1.default);
app.use('/api/guard', guardRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// ── HEALTH CHECK ───────────────────────────────────────────
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'GatePass API is running',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            visits: '/api/visits',
            admin: '/api/admin',
            guard: '/api/guard',
        },
    });
});
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'GatePass API is running ✅' });
});
// ── ERROR HANDLER (must be last) ───────────────────────────
app.use(errorMiddleware_1.errorMiddleware);
// ── CRON: Expire old QR codes (runs daily at midnight) ─────
node_cron_1.default.schedule('0 0 * * *', async () => {
    const result = await Visit_1.Visit.updateMany({ status: { $in: ['APPROVED', 'CHECKED_IN'] }, qrExpiresAt: { $lt: new Date() } }, { status: 'EXPIRED' });
    console.log(`🕛 Cron: Expired ${result.modifiedCount} old QR codes`);
});
// ── START SERVER ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
(0, connect_1.connectDB)().then(async () => {
    await (0, seedAdmin_1.seedAdminFromEnv)();
    app.listen(PORT, () => {
        console.log(`🚀 GatePass server running on http://localhost:${PORT}`);
    });
});
