import express from 'express';
import cors from 'cors';
import instructorRoutes from './routes/instructorRoutes';
import classRoutes from './routes/classRoutes';
import authRoutes from './routes/authRoutes';
import { requireAuth } from './middleware/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/instructors', requireAuth,instructorRoutes);
app.use('/api/classes', requireAuth,classRoutes);

export default app;
