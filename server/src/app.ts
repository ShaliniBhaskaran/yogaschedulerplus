import path from 'path';
import express from 'express';
import cors from 'cors';
import instructorRoutes from './routes/instructorRoutes';
import classRoutes from './routes/classRoutes';
import authRoutes from './routes/authRoutes';
import { requireAuth } from './middleware/authMiddleware';
import packageRoutes from './routes/packageRoutes';
import customerRoutes from './routes/customerRoutes';
import saleRoutes from './routes/saleRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/instructors', requireAuth, instructorRoutes);
app.use('/api/classes', requireAuth, classRoutes);
app.use('/api/packages', requireAuth, packageRoutes);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/sales', requireAuth, saleRoutes);
app.use('/api/attendance', requireAuth, attendanceRoutes);
app.use('/api/reports', requireAuth, reportRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

export default app;
