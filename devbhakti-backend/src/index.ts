import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import adminAuthRoutes from './routes/admin/authRoutes';
import adminTempleRoutes from './routes/admin/templeRoutes';
import adminPoojaRoutes from './routes/admin/poojaRoutes';
import institutionTempleRoutes from './routes/institution/templeRoutes';
import templeRoutes from './routes/templeRoutes';

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

// Institution Routes
app.use('/api/institution/temples', institutionTempleRoutes);

// General Routes (Temporary)
app.use('/api/temples', templeRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
