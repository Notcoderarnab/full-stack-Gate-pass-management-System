"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectVisit = exports.approveVisit = exports.getHostDashboard = exports.getHostRequests = void 0;
const crypto_1 = require("crypto");
const Visit_1 = require("../models/Visit");
const User_1 = require("../models/User");
const qrService_1 = require("../services/qrService");
const visitExpiry_1 = require("../utils/visitExpiry");
const emailService_1 = require("../services/emailService");
// ─────────────────────────────────────────────
// GET HOST REQUESTS
// ─────────────────────────────────────────────
const getHostRequests = async (req, res) => {
    try {
        await (0, visitExpiry_1.expireApprovedVisits)();
        const { status } = req.query;
        const filter = {
            hostId: req.user.id
        };
        if (status) {
            filter.status = status;
        }
        const visits = await Visit_1.Visit.find(filter)
            .populate('guestId', 'name email phone')
            .sort({
            createdAt: -1
        });
        return res.json({
            success: true,
            visits
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch requests'
        });
    }
};
exports.getHostRequests = getHostRequests;
// ─────────────────────────────────────────────
// HOST DASHBOARD
// ─────────────────────────────────────────────
const getHostDashboard = async (req, res) => {
    try {
        await (0, visitExpiry_1.expireApprovedVisits)();
        const hostId = req.user.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const [pending, approved, rejected, expired, todayVisits] = await Promise.all([
            Visit_1.Visit.countDocuments({
                hostId,
                status: 'PENDING'
            }),
            Visit_1.Visit.countDocuments({
                hostId,
                status: 'APPROVED'
            }),
            Visit_1.Visit.countDocuments({
                hostId,
                status: 'REJECTED'
            }),
            Visit_1.Visit.countDocuments({
                hostId,
                status: 'EXPIRED'
            }),
            Visit_1.Visit.countDocuments({
                hostId,
                visitDate: {
                    $gte: todayStart,
                    $lte: todayEnd
                }
            }),
        ]);
        return res.json({
            success: true,
            stats: {
                pending,
                approved,
                rejected,
                expired,
                todayVisits
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard'
        });
    }
};
exports.getHostDashboard = getHostDashboard;
// ─────────────────────────────────────────────
// APPROVE VISIT
// ─────────────────────────────────────────────
const approveVisit = async (req, res) => {
    try {
        const visit = await Visit_1.Visit.findOne({
            _id: req.params.id,
            hostId: req.user.id
        })
            .populate('guestId', 'name email');
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }
        if (visit.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Visit is not in PENDING state'
            });
        }
        // GET HOST DETAILS
        const host = await User_1.User.findById(req.user.id).select('name');
        // GENERATE QR TOKEN
        const qrToken = (0, crypto_1.randomUUID)();
        // FRONTEND VERIFY URL
        const qrPayload = (0, qrService_1.buildQrPayload)(qrToken);
        // GENERATE QR IMAGE
        const qrCodeImageBase64 = await (0, qrService_1.generateQRCode)(qrPayload);
        // QR EXPIRY
        const expiresAt = new Date(visit.visitDate);
        expiresAt.setHours(23, 59, 59, 999);
        // UPDATE VISIT
        visit.status = 'APPROVED';
        visit.hostNote =
            req.body.hostNote || '';
        visit.qrToken = qrToken;
        visit.qrCodeImageBase64 =
            qrCodeImageBase64;
        visit.qrGeneratedAt =
            new Date();
        visit.qrExpiresAt =
            expiresAt;
        await visit.save();
        // SEND APPROVAL EMAIL
        const guest = visit.guestId;
        try {
            await (0, emailService_1.sendApprovalEmail)({
                guestEmail: guest.email,
                guestName: guest.name,
                hostName: host?.name || 'Your Host',
                visitDate: visit.visitDate,
                timeSlot: visit.visitTimeSlot,
                qrCodeBase64: qrCodeImageBase64,
            });
        }
        catch (error) {
            console.warn('Approval email failed:', error);
        }
        return res.json({
            success: true,
            visit
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to approve visit'
        });
    }
};
exports.approveVisit = approveVisit;
// ─────────────────────────────────────────────
// REJECT VISIT
// ─────────────────────────────────────────────
const rejectVisit = async (req, res) => {
    try {
        const visit = await Visit_1.Visit.findOne({
            _id: req.params.id,
            hostId: req.user.id
        })
            .populate('guestId', 'name email');
        if (!visit ||
            visit.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cannot reject this visit'
            });
        }
        const reason = req.body.reason ||
            'No reason provided';
        visit.status = 'REJECTED';
        visit.hostNote = reason;
        await visit.save();
        // SEND REJECTION EMAIL
        const guest = visit.guestId;
        try {
            await (0, emailService_1.sendRejectionEmail)({
                guestEmail: guest.email,
                guestName: guest.name,
                reason,
            });
        }
        catch (error) {
            console.warn('Rejection email failed:', error);
        }
        return res.json({
            success: true,
            visit
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to reject visit'
        });
    }
};
exports.rejectVisit = rejectVisit;
