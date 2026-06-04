"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectVisitByAdmin = exports.approveVisitByAdmin = exports.getAllScanLogs = exports.getAllVisits = exports.updateUserRole = exports.toggleUserStatus = exports.getAllUsers = exports.getAdminStats = void 0;
const crypto_1 = require("crypto");
const User_1 = require("../models/User");
const Visit_1 = require("../models/Visit");
const ScanLog_1 = require("../models/ScanLog");
const qrService_1 = require("../services/qrService");
const emailService_1 = require("../services/emailService");
const visitExpiry_1 = require("../utils/visitExpiry");
// ─────────────────────────────────────────────
// GET ADMIN DASHBOARD STATS
// ─────────────────────────────────────────────
const getAdminStats = async (req, res) => {
    try {
        await (0, visitExpiry_1.expireApprovedVisits)();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [totalUsers, guests, hosts, guards, totalVisits, pendingVisits, approvedVisits, rejectedVisits, checkedInVisits, expiredVisits, todayVisits, totalScans] = await Promise.all([
            User_1.User.countDocuments(),
            User_1.User.countDocuments({
                role: 'GUEST'
            }),
            User_1.User.countDocuments({
                role: 'HOST'
            }),
            User_1.User.countDocuments({
                role: 'GUARD'
            }),
            Visit_1.Visit.countDocuments(),
            Visit_1.Visit.countDocuments({
                status: 'PENDING'
            }),
            Visit_1.Visit.countDocuments({
                status: 'APPROVED'
            }),
            Visit_1.Visit.countDocuments({
                status: 'REJECTED'
            }),
            Visit_1.Visit.countDocuments({
                status: 'CHECKED_IN'
            }),
            Visit_1.Visit.countDocuments({
                status: 'EXPIRED'
            }),
            Visit_1.Visit.countDocuments({
                visitDate: {
                    $gte: todayStart
                }
            }),
            ScanLog_1.ScanLog.countDocuments(),
        ]);
        return res.json({
            success: true,
            stats: {
                totalUsers,
                guests,
                hosts,
                guards,
                totalVisits,
                pendingVisits,
                approvedVisits,
                rejectedVisits,
                checkedInVisits,
                expiredVisits,
                todayVisits,
                totalScans,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch admin stats'
        });
    }
};
exports.getAdminStats = getAdminStats;
// ─────────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.User.find()
            .select('-passwordHash')
            .sort({
            createdAt: -1
        });
        return res.json({
            success: true,
            users
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};
exports.getAllUsers = getAllUsers;
// ─────────────────────────────────────────────
// TOGGLE USER STATUS
// ─────────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        user.isActive = !user.isActive;
        await user.save();
        return res.json({
            success: true,
            user,
            message: `User ${user.isActive
                ? 'activated'
                : 'deactivated'} successfully`
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};
exports.toggleUserStatus = toggleUserStatus;
// ─────────────────────────────────────────────
// UPDATE USER ROLE
// ─────────────────────────────────────────────
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['GUEST', 'HOST', 'GUARD', 'ADMIN']
            .includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        user.role = role;
        await user.save();
        return res.json({
            success: true,
            user,
            message: 'Role updated successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update role'
        });
    }
};
exports.updateUserRole = updateUserRole;
// ─────────────────────────────────────────────
// GET ALL VISITS
// ─────────────────────────────────────────────
const getAllVisits = async (req, res) => {
    try {
        await (0, visitExpiry_1.expireApprovedVisits)();
        const visits = await Visit_1.Visit.find()
            .populate('guestId', 'name email')
            .populate('hostId', 'name department')
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
            message: 'Failed to fetch visits'
        });
    }
};
exports.getAllVisits = getAllVisits;
// ─────────────────────────────────────────────
// GET ALL SCAN LOGS
// ─────────────────────────────────────────────
const getAllScanLogs = async (req, res) => {
    try {
        const logs = await ScanLog_1.ScanLog.find()
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
exports.getAllScanLogs = getAllScanLogs;
const approveVisitByAdmin = async (req, res) => {
    try {
        const visit = await Visit_1.Visit.findById(req.params.id)
            .populate('guestId', 'name email')
            .populate('hostId', 'name department');
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }
        if (visit.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Only pending visits can be approved'
            });
        }
        const qrToken = (0, crypto_1.randomUUID)();
        const qrCodeImageBase64 = await (0, qrService_1.generateQRCode)((0, qrService_1.buildQrPayload)(qrToken));
        const expiresAt = new Date(visit.visitDate);
        expiresAt.setHours(23, 59, 59, 999);
        visit.status = 'APPROVED';
        visit.hostNote = req.body.hostNote || 'Approved by admin';
        visit.qrToken = qrToken;
        visit.qrCodeImageBase64 = qrCodeImageBase64;
        visit.qrGeneratedAt = new Date();
        visit.qrExpiresAt = expiresAt;
        await visit.save();
        const guest = visit.guestId;
        const host = visit.hostId;
        try {
            await (0, emailService_1.sendApprovalEmail)({
                guestEmail: guest.email,
                guestName: guest.name,
                hostName: host?.name || 'GatePass Admin',
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
exports.approveVisitByAdmin = approveVisitByAdmin;
const rejectVisitByAdmin = async (req, res) => {
    try {
        const visit = await Visit_1.Visit.findById(req.params.id).populate('guestId', 'name email');
        if (!visit || visit.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cannot reject this visit'
            });
        }
        const reason = req.body.reason || 'Rejected by admin';
        visit.status = 'REJECTED';
        visit.hostNote = reason;
        await visit.save();
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
exports.rejectVisitByAdmin = rejectVisitByAdmin;
