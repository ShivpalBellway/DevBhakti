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
const productRoutes_1 = __importDefault(require("./routes/admin/productRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/admin/categoryRoutes"));
// (adminInstitutionRoutes merged into adminTempleRoutes)
const cmsRoutes_1 = __importDefault(require("./routes/admin/cmsRoutes"));
const templeRoutes_2 = __importDefault(require("./routes/temple_admin/templeRoutes"));
const poojaRoutes_2 = __importDefault(require("./routes/temple_admin/poojaRoutes"));
const sellerRoutes_1 = __importDefault(require("./routes/admin/sellerRoutes"));
const eventRoutes_2 = __importDefault(require("./routes/temple_admin/eventRoutes"));
const templeRoutes_3 = __importDefault(require("./routes/templeRoutes"));
const authRoutes_2 = __importDefault(require("./routes/devotee/authRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/devotee/favoriteRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/devotee/bookingRoutes"));
const bookingRoutes_2 = __importDefault(require("./routes/admin/bookingRoutes"));
const bookingRoutes_3 = __importDefault(require("./routes/temple_admin/bookingRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/devotee/cartRoutes"));
const productOrderRoutes_1 = __importDefault(require("./routes/marketplace/productOrderRoutes"));
const productOrderRoutes_2 = __importDefault(require("./routes/admin/productOrderRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/admin/dashboardRoutes"));
const productOrderRoutes_3 = __importDefault(require("./routes/temple_admin/productOrderRoutes"));
const shiprocketRoutes_1 = __importDefault(require("./routes/shiprocketRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const financeManagementRoutes_1 = __importDefault(require("./routes/admin/financeManagementRoutes"));
const financeRoutes_1 = __importDefault(require("./routes/temple_admin/financeRoutes"));
const productRoutes_2 = __importDefault(require("./routes/temple_admin/productRoutes"));
const bankRoutes_1 = __importDefault(require("./routes/temple_admin/bankRoutes"));
const productRoutes_3 = __importDefault(require("./routes/seller/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/seller/orderRoutes"));
const sellerRoutes_2 = __importDefault(require("./routes/seller/sellerRoutes"));
const financeRoutes_2 = __importDefault(require("./routes/seller/financeRoutes"));
const commissionSlabRoutes_1 = __importDefault(require("./routes/admin/commissionSlabRoutes"));
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
app.use('/api/admin/products', productRoutes_1.default);
app.use('/api/admin/categories', categoryRoutes_1.default);
app.use('/api/admin/events', eventRoutes_1.default);
app.use('/api/admin/bookings', bookingRoutes_2.default);
// (institutions merged into temples)
app.use('/api/admin/cms', cmsRoutes_1.default);
app.use('/api/admin/orders', productOrderRoutes_2.default);
app.use('/api/admin/finance', financeManagementRoutes_1.default);
app.use('/api/admin/sellers', sellerRoutes_1.default);
app.use('/api/admin/dashboard', dashboardRoutes_1.default);
app.use('/api/admin/commission-slabs', commissionSlabRoutes_1.default);
// Temple Admin Routes
app.use('/api/temple-admin/temples', templeRoutes_2.default);
app.use('/api/temple-admin/poojas', poojaRoutes_2.default);
app.use('/api/temple-admin/events', eventRoutes_2.default);
app.use('/api/temple-admin/bookings', bookingRoutes_3.default);
app.use('/api/temple-admin/orders', productOrderRoutes_3.default);
app.use('/api/temple-admin/finance', financeRoutes_1.default);
app.use('/api/temple-admin/products', productRoutes_2.default);
app.use('/api/temple-admin/bank', bankRoutes_1.default);
app.use('/api/seller/products', productRoutes_3.default);
app.use('/api/seller/orders', orderRoutes_1.default);
app.use('/api/seller/finance', financeRoutes_2.default);
app.use('/api/seller', sellerRoutes_2.default);
// Devotee Auth Routes
app.use('/api/auth', authRoutes_2.default);
app.use('/api/favorites', favoriteRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/orders', productOrderRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/shiprocket-webhook', shiprocketRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
// General Routes (Temporary)
app.use('/api/temples', templeRoutes_3.default);
// Basic Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Max limit is 3MB.' });
    }
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
