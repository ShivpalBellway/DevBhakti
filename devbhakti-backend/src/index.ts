import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import adminAuthRoutes from './routes/admin/authRoutes';
import adminTempleRoutes from './routes/admin/templeRoutes';
import adminPoojaRoutes from './routes/admin/poojaRoutes';
import adminEventRoutes from './routes/admin/eventRoutes';
import adminProductRoutes from './routes/admin/productRoutes';
// (adminInstitutionRoutes merged into adminTempleRoutes)
import adminCmsRoutes from './routes/admin/cmsRoutes';
import templeAdminTempleRoutes from './routes/temple_admin/templeRoutes';
import templeAdminPoojaRoutes from './routes/temple_admin/poojaRoutes';
import templeAdminEventRoutes from './routes/temple_admin/eventRoutes';
import templeRoutes from './routes/templeRoutes';
import authRoutes from './routes/devotee/authRoutes';
import favoriteRoutes from './routes/devotee/favoriteRoutes';




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
app.use('/api/admin/events', adminEventRoutes);
// (institutions merged into temples)
app.use('/api/admin/cms', adminCmsRoutes);


// Temple Admin Routes
app.use('/api/temple-admin/temples', templeAdminTempleRoutes);
app.use('/api/temple-admin/poojas', templeAdminPoojaRoutes);
app.use('/api/temple-admin/events', templeAdminEventRoutes);

// Devotee Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);


// General Routes (Temporary)
app.use('/api/temples', templeRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
