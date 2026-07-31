import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initializeSchema } from './db/schema';
import authRoutes from './routes/auth';
import userRoutes, { searchRouter } from './routes/user';
import walletRoutes from './routes/wallet';
import transactionRoutes from './routes/transactions';
import transferRoutes from './routes/transfers';
import devRoutes from './routes/dev';
import subscriptionRoutes from './routes/subscription';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize database schema on startup
initializeSchema();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/profile', userRoutes);        // iOS: GET /profile
app.use('/user', userRoutes);           // backwards compat: GET /user/profile
app.use('/wallet', walletRoutes);
app.use('/wallet', transferRoutes);      // Bank linking & transfers
app.use('/transactions', transactionRoutes);
app.use('/users/search', searchRouter);  // iOS: GET /users/search?q=
app.use('/dev', devRoutes);              // Dev/test endpoints
app.use('/subscription', subscriptionRoutes);  // Subscription management

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fluxpay-api', version: '1.0.0' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FluxPay API] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[FluxPay API] Health check: http://0.0.0.0:${PORT}/health`);
});

export { app, server };