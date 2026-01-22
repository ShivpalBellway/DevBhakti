"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../lib/prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user by email and ensure they are an ADMIN
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || user.role !== 'ADMIN' || !user.password) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        // Check password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        // Generate JWT Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Admin login successful',
            token,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.adminLogin = adminLogin;
