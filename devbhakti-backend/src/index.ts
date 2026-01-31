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
import templeAdminTempleRoutes from './routes/temple_admin/templeRoutes';
import templeAdminPoojaRoutes from './routes/temple_admin/poojaRoutes';
import adminSellerRoutes from './routes/admin/sellerRoutes';
import templeAdminEventRoutes from './routes/temple_admin/eventRoutes';
import templeRoutes from './routes/templeRoutes';
import authRoutes from './routes/devotee/authRoutes';
import favoriteRoutes from './routes/devotee/favoriteRoutes';
import bookingRoutes from './routes/devotee/bookingRoutes';
import adminBookingRoutes from './routes/admin/bookingRoutes';
import templeAdminBookingRoutes from './routes/temple_admin/bookingRoutes';
import publicOrderRoutes from './routes/marketplace/productOrderRoutes';
import adminOrderRoutes from './routes/admin/productOrderRoutes';
import templeAdminOrderRoutes from './routes/temple_admin/productOrderRoutes';

import adminFinanceManagementRoutes from './routes/admin/financeManagementRoutes';
import templeAdminFinanceRoutes from './routes/temple_admin/financeRoutes';
import templeAdminProductRoutes from './routes/temple_admin/productRoutes';
import sellerProductRoutes from './routes/seller/productRoutes';
import sellerOrderRoutes from './routes/seller/orderRoutes';
import sellerGeneralRoutes from './routes/seller/sellerRoutes';

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
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);
// (institutions merged into temples)
app.use('/api/admin/cms', adminCmsRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/finance', adminFinanceManagementRoutes);
app.use('/api/admin/sellers', adminSellerRoutes);


// Temple Admin Routes
app.use('/api/temple-admin/temples', templeAdminTempleRoutes);
app.use('/api/temple-admin/poojas', templeAdminPoojaRoutes);
app.use('/api/temple-admin/events', templeAdminEventRoutes);
app.use('/api/temple-admin/bookings', templeAdminBookingRoutes);
app.use('/api/temple-admin/orders', templeAdminOrderRoutes);
app.use('/api/temple-admin/finance', templeAdminFinanceRoutes);
app.use('/api/temple-admin/products', templeAdminProductRoutes);
app.use('/api/seller/products', sellerProductRoutes);
app.use('/api/seller/orders', sellerOrderRoutes);
app.use('/api/seller', sellerGeneralRoutes);

// Devotee Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', publicOrderRoutes);


// General Routes (Temporary)
app.use('/api/temples', templeRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
