"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHosts = exports.cancelVisit = exports.getVisitById = exports.getMyVisits = exports.createVisit = void 0;
const zod_1 = require("zod");
const Visit_1 = require("../models/Visit");
const User_1 = require("../models/User");
const visitExpiry_1 = require("../utils/visitExpiry");
// ─────────────────────────────────────────────
// VALIDATION SCHEMA
// ─────────────────────────────────────────────
const createVisitSchema = zod_1.z.object({
    hostId: zod_1.z.string().min(1, 'Host ID required'),
    purposeOfVisit: zod_1.z.string().min(5, 'Purpose must be at least 5 characters'),
    visitDate: zod_1.z.string().datetime('Invalid date format'),
    visitTimeSlot: zod_1.z.string().min(1, 'Time slot required'),
    gate: zod_1.z.string().trim().min(1).max(50).optional(),
    guestNote: zod_1.z.string().optional(),
});
// ─────────────────────────────────────────────
// CREATE VISIT
// ─────────────────────────────────────────────
const createVisit = async (req, res) => {
    try {
        const parsed = createVisitSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                errors: parsed.error.flatten()
            });
        }
        const { hostId, purposeOfVisit, visitDate, visitTimeSlot, gate, guestNote } = parsed.data;
        // CHECK HOST
        const host = await User_1.User.findOne({
            _id: hostId,
            role: 'HOST',
            isActive: true
        });
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host not found'
            });
        }
        // CREATE VISIT
        const visit = await Visit_1.Visit.create({
            guestId: req.user.id,
            hostId,
            purposeOfVisit,
            visitDate: new Date(visitDate),
            visitTimeSlot,
            gate: gate || 'Gate A',
            guestNote,
            status: 'PENDING',
        });
        // POPULATE HOST DETAILS
        const populated = await visit.populate([
            {
                path: 'hostId',
                select: 'name email department'
            }
        ]);
        return res.status(201).json({
            success: true,
            visit: populated
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create visit'
        });
    }
};
exports.createVisit = createVisit;
// ─────────────────────────────────────────────
// GET MY VISITS
// ─────────────────────────────────────────────
const getMyVisits = async (req, res) => {
    try {
        await (0, visitExpiry_1.expireApprovedVisits)();
        const visits = await Visit_1.Visit.find({
            guestId: req.user.id
        })
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
exports.getMyVisits = getMyVisits;
// ─────────────────────────────────────────────
// GET VISIT BY ID
// ─────────────────────────────────────────────
const getVisitById = async (req, res) => {
    try {
        await (0, visitExpiry_1.expireApprovedVisits)();
        const visit = await Visit_1.Visit.findOne({
            _id: req.params.id,
            guestId: req.user.id
        })
            .populate('hostId', 'name department');
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }
        return res.json({
            success: true,
            visit
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch visit'
        });
    }
};
exports.getVisitById = getVisitById;
// ─────────────────────────────────────────────
// CANCEL VISIT
// ─────────────────────────────────────────────
const cancelVisit = async (req, res) => {
    try {
        const visit = await Visit_1.Visit.findOne({
            _id: req.params.id,
            guestId: req.user.id
        });
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }
        if (visit.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a visit with status: ${visit.status}`
            });
        }
        await Visit_1.Visit.findByIdAndDelete(req.params.id);
        return res.json({
            success: true,
            message: 'Visit cancelled successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel visit'
        });
    }
};
exports.cancelVisit = cancelVisit;
// ─────────────────────────────────────────────
// GET ALL HOSTS
// ─────────────────────────────────────────────
const getHosts = async (req, res) => {
    try {
        const hosts = await User_1.User.find({
            role: 'HOST',
            isActive: true
        })
            .select('name email department');
        return res.json({
            success: true,
            hosts
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch hosts'
        });
    }
};
exports.getHosts = getHosts;
