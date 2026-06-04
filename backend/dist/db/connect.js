"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is missing. Add it to server/.env before starting the API.');
        }
        if (mongoUri.startsWith('mongodb+srv://')) {
            const configuredDnsServers = dns_1.default.getServers();
            const usesLocalDnsOnly = configuredDnsServers.length > 0 &&
                configuredDnsServers.every(server => server === '127.0.0.1' || server === '::1');
            if (usesLocalDnsOnly) {
                const fallbackServers = process.env.DNS_SERVERS?.split(',').map(server => server.trim()).filter(Boolean) ||
                    ['1.1.1.1', '8.8.8.8'];
                dns_1.default.setServers(fallbackServers);
            }
        }
        const conn = await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
