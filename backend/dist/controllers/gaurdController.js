"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScanLogs = exports.scanQRCode = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Visit_1 = require("../models/Visit");
const ScanLog_1 = require("../models/ScanLog");
const qrService_1 = require("../services/qrService");
// ─────────────────────────────────────────────
// SCAN QR CODE
// ─────────────────────────────────────────────
const scanQRCode = async (req, res) => {
    try {
        const normalizedQrToken = (0, qrService_1.extractQrToken)(req.body.qrToken);
        const visitLookup = mongoose_1.default.isValidObjectId(normalizedQrToken)
            ? {
                $or: [
                    { qrToken: normalizedQrToken },
                    { _id: normalizedQrToken },
                ],
            }
            : { qrToken: normalizedQrToken };
        // CHECK TOKEN
        if (!normalizedQrToken) {
            return res.status(400).json({
                success: false,
                message: 'QR token is required'
            });
        }
        // FIND VISIT
        const visit = await Visit_1.Visit.findOne(visitLookup)
            .populate('guestId', 'name email phone')
            .populate('hostId', 'name department');
        // INVALID TOKEN
        if (!visit) {
            return res.status(404).json({
                success: false,
                result: 'INVALID',
                message: 'QR code not recognized',
            });
        }
        // NOT APPROVED
        if (visit.status !== 'APPROVED') {
            await ScanLog_1.ScanLog.create({
                visitId: visit._id,
                scannedBy: req.user.id,
                result: 'NOT_APPROVED'
            });
            return res.status(403).json({
                success: false,
                result: 'NOT_APPROVED',
                message: `Visit status is ${visit.status}`,
            });
        }
        // QR EXPIRED
        if (visit.qrExpiresAt &&
            visit.qrExpiresAt < new Date()) {
            await ScanLog_1.ScanLog.create({
                visitId: visit._id,
                scannedBy: req.user.id,
                result: 'EXPIRED'
            });
            visit.status = 'EXPIRED';
            await visit.save();
            return res.status(403).json({
                success: false,
                result: 'EXPIRED',
                message: 'This QR code has expired',
            });
        }
        // ALREADY CHECKED IN
        if (visit.checkedInAt) {
            await ScanLog_1.ScanLog.create({
                visitId: visit._id,
                scannedBy: req.user.id,
                result: 'ALREADY_USED'
            });
            return res.status(403).json({
                success: false,
                result: 'ALREADY_USED',
                message: 'This QR code has already been used',
                checkedInAt: visit.checkedInAt,
            });
        }
        // ─────────────────────────────────────
        // ENTRY SUCCESS
        // ─────────────────────────────────────
        visit.status = 'CHECKED_IN';
        visit.checkedInAt = new Date();
        await visit.save();
        await ScanLog_1.ScanLog.create({
            visitId: visit._id,
            scannedBy: req.user.id,
            result: 'SUCCESS'
        });
        const guest = visit.guestId;
        const host = visit.hostId;
        return res.json({
            success: true,
            result: 'SUCCESS',
            message: 'Entry granted! ✅',
            visitor: {
                name: guest.name,
                email: guest.email,
                phone: guest.phone,
                host: host.name,
                department: host.department,
                timeSlot: visit.visitTimeSlot,
                purpose: visit.purposeOfVisit,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Scan failed'
        });
    }
};
exports.scanQRCode = scanQRCode;
// ─────────────────────────────────────────────
// GET SCAN LOGS
// ─────────────────────────────────────────────
const getScanLogs = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const logs = await ScanLog_1.ScanLog.find({
            scannedBy: req.user.id,
            createdAt: {
                $gte: todayStart
            },
        })
            .populate({
            path: 'visitId',
            populate: [
                {
                    path: 'guestId',
                    select: 'name email'
                },
                {
                    path: 'hostId',
                    select: 'name department'
                },
            ],
        })
            .sort({
            createdAt: -1
        });
        return res.json({
            success: true,
            logs
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch scan logs'
        });
    }
};
exports.getScanLogs = getScanLogs;
