"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// PROTECT ALL ADMIN ROUTES
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.requireRole)('ADMIN'));
// DASHBOARD
router.get('/stats', adminController_1.getAdminStats);
// USERS
router.get('/users', adminController_1.getAllUsers);
router.patch('/users/:id/status', adminController_1.toggleUserStatus);
router.patch('/users/:id/role', adminController_1.updateUserRole);
// VISITS
router.get('/visits', adminController_1.getAllVisits);
router.patch('/visits/:id/approve', adminController_1.approveVisitByAdmin);
router.patch('/requests/:id/approve', adminController_1.approveVisitByAdmin);
router.patch('/visits/:id/reject', adminController_1.rejectVisitByAdmin);
router.patch('/requests/:id/reject', adminController_1.rejectVisitByAdmin);
// SCAN LOGS
router.get('/logs', adminController_1.getAllScanLogs);
exports.default = router;
