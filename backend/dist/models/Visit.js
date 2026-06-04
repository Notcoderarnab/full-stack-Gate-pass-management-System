"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Visit = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const visitSchema = new mongoose_1.Schema({
    guestId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    purposeOfVisit: { type: String, required: true },
    visitDate: { type: Date, required: true },
    visitTimeSlot: { type: String, required: true },
    gate: { type: String, trim: true, default: 'Gate A' },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'COMPLETED', 'EXPIRED'],
        default: 'PENDING',
    },
    guestNote: { type: String },
    hostNote: { type: String },
    qrToken: { type: String, unique: true, sparse: true },
    qrCodeImageBase64: { type: String },
    qrGeneratedAt: { type: Date },
    qrExpiresAt: { type: Date },
    checkedInAt: { type: Date },
}, { timestamps: true });
// Index for fast QR token lookup
visitSchema.index({ qrToken: 1 });
exports.Visit = mongoose_1.default.model('Visit', visitSchema);
