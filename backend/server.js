import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { seedDatabase } from './seed/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB & Seed if empty
connectDB().then(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error('[Startup Seeder Error]', err.message);
  }
});

// Health Check API
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.json({
    status: 'UP',
    application: 'Resource Bridge',
    subtitle: 'Government School Resource Allocation & Management System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    databaseStatus: states[dbState] || 'Unknown',
    databaseProduct: 'MongoDB',
    databaseVersion: mongoose.version,
    databaseHost: mongoose.connection.host || '127.0.0.1:27017'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Core API routes
app.use('/api', apiRoutes);

// Default 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log('=================================================');
  console.log(`  Resource Bridge Backend (Node.js/MongoDB)`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log('=================================================');
});
