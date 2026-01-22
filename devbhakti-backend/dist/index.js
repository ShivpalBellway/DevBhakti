"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/admin/authRoutes"));
const templeRoutes_1 = __importDefault(require("./routes/admin/templeRoutes"));
const poojaRoutes_1 = __importDefault(require("./routes/admin/poojaRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/admin/eventRoutes"));
// (adminInstitutionRoutes merged into adminTempleRoutes)
const cmsRoutes_1 = __importDefault(require("./routes/admin/cmsRoutes"));
const templeRoutes_2 = __importDefault(require("./routes/temple_admin/templeRoutes"));
const poojaRoutes_2 = __importDefault(require("./routes/temple_admin/poojaRoutes"));
const eventRoutes_2 = __importDefault(require("./routes/temple_admin/eventRoutes"));
const templeRoutes_3 = __importDefault(require("./routes/templeRoutes"));
const authRoutes_2 = __importDefault(require("./routes/devotee/authRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/devotee/favoriteRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'DevBhakti Backend is running' });
});
// Admin Routes
app.use('/api/admin/auth', authRoutes_1.default);
app.use('/api/admin/temples', templeRoutes_1.default);
app.use('/api/admin/poojas', poojaRoutes_1.default);
app.use('/api/admin/events', eventRoutes_1.default);
// (institutions merged into temples)
app.use('/api/admin/cms', cmsRoutes_1.default);
// Temple Admin Routes
app.use('/api/temple-admin/temples', templeRoutes_2.default);
app.use('/api/temple-admin/poojas', poojaRoutes_2.default);
app.use('/api/temple-admin/events', eventRoutes_2.default);
// Devotee Auth Routes
app.use('/api/auth', authRoutes_2.default);
app.use('/api/favorites', favoriteRoutes_1.default);
// General Routes (Temporary)
app.use('/api/temples', templeRoutes_3.default);
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
