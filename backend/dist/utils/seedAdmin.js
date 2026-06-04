"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminFromEnv = seedAdminFromEnv;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
async function seedAdminFromEnv() {
    const name = process.env.ADMIN_SEED_NAME?.trim();
    const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_SEED_PASSWORD?.trim();
    if (!name || !email || !password) {
        return;
    }
    const existingUser = await User_1.User.findOne({ email });
    if (existingUser) {
        if (existingUser.role === 'ADMIN') {
            console.log(`✅ Admin user already exists: ${email}`);
            return;
        }
        console.warn(`⚠️ Cannot seed admin because the email ${email} already exists with role ${existingUser.role}.` +
            ' Use a different ADMIN_SEED_EMAIL or remove the existing account.');
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    await User_1.User.create({
        name,
        email,
        passwordHash,
        role: 'ADMIN',
    });
    console.log(`✅ Admin user seeded successfully: ${email}`);
}
