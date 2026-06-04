"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = exports.extractQrToken = exports.buildQrPayload = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const buildQrPayload = (qrToken) => {
    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const verifyUrl = new URL('/verify', frontendUrl);
    verifyUrl.searchParams.set('token', qrToken);
    return verifyUrl.toString();
};
exports.buildQrPayload = buildQrPayload;
const extractQrToken = (value) => {
    if (typeof value !== 'string') {
        return '';
    }
    const normalizedValue = value.trim();
    if (!normalizedValue) {
        return '';
    }
    try {
        const parsedUrl = new URL(normalizedValue);
        return parsedUrl.searchParams.get('token')?.trim() || normalizedValue;
    }
    catch {
        return normalizedValue;
    }
};
exports.extractQrToken = extractQrToken;
const generateQRCode = async (data) => {
    try {
        const qrDataUrl = await qrcode_1.default.toDataURL(data, {
            width: 400,
            margin: 2,
            color: {
                dark: '#1a1a1a',
                light: '#ffffff',
            },
        });
        return qrDataUrl;
    }
    catch (error) {
        throw new Error('QR code generation failed');
    }
};
exports.generateQRCode = generateQRCode;
