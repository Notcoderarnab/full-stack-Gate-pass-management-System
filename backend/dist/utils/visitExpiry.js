"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireApprovedVisits = void 0;
const Visit_1 = require("../models/Visit");
const expireApprovedVisits = async () => {
    await Visit_1.Visit.updateMany({ status: { $in: ['APPROVED', 'CHECKED_IN'] }, qrExpiresAt: { $lt: new Date() } }, { $set: { status: 'EXPIRED' } });
};
exports.expireApprovedVisits = expireApprovedVisits;
