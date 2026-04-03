import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import adminAuthRoutes from './routes/admin/authRoutes';
import adminTempleRoutes from './routes/admin/templeRoutes';
import adminPoojaRoutes from './routes/admin/poojaRoutes';
import adminEventRoutes from './routes/admin/eventRoutes';
import adminProductRoutes from './routes/admin/productRoutes';
import adminCategoryRoutes from './routes/admin/categoryRoutes';
// (adminInstitutionRoutes merged into adminTempleRoutes)
import adminCmsRoutes from './routes/admin/cmsRoutes';
import adminPoojaCategoryRoutes from './routes/admin/poojaCategoryRoutes';
import templeAdminTempleRoutes from './routes/temple_admin/templeRoutes';
import templeAdminPoojaRoutes from './routes/temple_admin/poojaRoutes';
import adminSellerRoutes from './routes/admin/sellerRoutes';
import templeAdminEventRoutes from './routes/temple_admin/eventRoutes';
import templeRoutes from './routes/templeRoutes';
import poojaCategoryRoutes from './routes/poojaCategoryRoutes';
import authRoutes from './routes/devotee/authRoutes';
import favoriteRoutes from './routes/devotee/favoriteRoutes';
import bookingRoutes from './routes/devotee/bookingRoutes';
import adminBookingRoutes from './routes/admin/bookingRoutes';
import templeAdminBookingRoutes from './routes/temple_admin/bookingRoutes';
import cartRoutes from './routes/devotee/cartRoutes';
import publicOrderRoutes from './routes/marketplace/productOrderRoutes';
import adminOrderRoutes from './routes/admin/productOrderRoutes';
import adminDashboardRoutes from './routes/admin/dashboardRoutes';
import templeAdminOrderRoutes from './routes/temple_admin/productOrderRoutes';
import shiprocketWebhookRoutes from './routes/shiprocketRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminDonationRoutes from "./routes/admin/donationRoutes";
import templeDonationRoutes from "./routes/temple_admin/templeDonationRoutes";
import donationRoutes from './routes/devotee/donationRoutes';
import adminMarketingRoutes from './routes/admin/marketingRoutes';

import adminFinanceManagementRoutes from './routes/admin/financeManagementRoutes';
import templeAdminFinanceRoutes from './routes/temple_admin/financeRoutes';
import templeAdminProductRoutes from './routes/temple_admin/productRoutes';
import templeAdminBankRoutes from './routes/temple_admin/bankRoutes';
import templeAdminDevoteeRoutes from './routes/temple_admin/devoteeRoutes';
import sellerProductRoutes from './routes/seller/productRoutes';
import sellerOrderRoutes from './routes/seller/orderRoutes';
import sellerGeneralRoutes from './routes/seller/sellerRoutes';
import sellerFinanceRoutes from './routes/seller/financeRoutes';
import adminCommissionSlabRoutes from './routes/admin/commissionSlabRoutes';
import adminUserRoutes from './routes/admin/userRoutes';
import publicSearchRoutes from './routes/publicSearchRoutes';
import adminStaffManagementRoutes from './routes/admin/staffManagementRoutes';
import templeAdminStaffManagementRoutes from './routes/temple_admin/staffManagementRoutes';
import sellerStaffManagementRoutes from './routes/seller/staffManagementRoutes';
import notificationRoutes from './routes/notificationRoutes';
import './services/firebaseService'; // Initialize Firebase Admin on startup

import adminSettingsRoutes from './routes/admin/globalSettingsRoutes';
import adminFaqRoutes from './routes/admin/faqRoutes';
import publicFaqRoutes from './routes/faqRoutes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'DevBhakti Backend is running' });
});

// Admin Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/temples', adminTempleRoutes);
app.use('/api/admin/poojas', adminPoojaRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/pooja-categories', adminPoojaCategoryRoutes);
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);
// (institutions merged into temples)
app.use('/api/admin/cms', adminCmsRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/finance', adminFinanceManagementRoutes);
app.use('/api/admin/sellers', adminSellerRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/commission-slabs', adminCommissionSlabRoutes);
app.use('/api/admin/team', adminStaffManagementRoutes);
app.use("/api/admin/donations", adminDonationRoutes);
app.use('/api/admin/marketing', adminMarketingRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/faqs', adminFaqRoutes);



// Temple Admin Routes
app.use('/api/temple-admin/temples', templeAdminTempleRoutes);
app.use('/api/temple-admin/poojas', templeAdminPoojaRoutes);
app.use('/api/temple-admin/events', templeAdminEventRoutes);
app.use('/api/temple-admin/bookings', templeAdminBookingRoutes);
app.use('/api/temple-admin/orders', templeAdminOrderRoutes);
app.use('/api/temple-admin/finance', templeAdminFinanceRoutes);
app.use('/api/temple-admin/products', templeAdminProductRoutes);
app.use('/api/temple-admin/bank', templeAdminBankRoutes);
app.use('/api/temple-admin/devotees', templeAdminDevoteeRoutes);
app.use('/api/temple-admin/team', templeAdminStaffManagementRoutes);
app.use("/api/temple-admin/donations", templeDonationRoutes);
// (Donations are mostly public/temple managed)
app.use('/api/pooja-categories', poojaCategoryRoutes);
app.use('/api/seller/products', sellerProductRoutes);
app.use('/api/seller/orders', sellerOrderRoutes);
app.use('/api/seller/finance', sellerFinanceRoutes);
app.use('/api/seller/team', sellerStaffManagementRoutes);
app.use('/api/seller', sellerGeneralRoutes);

// Devotee Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', publicOrderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shiprocket-webhook', shiprocketWebhookRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/donations', donationRoutes);


// General Routes (Temporary)
app.use('/api/temples', templeRoutes);
app.use('/api/search', publicSearchRoutes);
app.use('/api/faqs', publicFaqRoutes);

app.get('/api/testfaq', (req, res) => res.json({ msg: 'working' }));

// Notification Routes (FCM Token Register/Remove)
app.use('/api/notifications', notificationRoutes);


// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large. Max limit is 3MB.' });
  }
  return res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
