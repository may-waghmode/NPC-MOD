const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const questRoutes = require('./routes/quests');
const playerRoutes = require('./routes/player');
const socialRoutes = require('./routes/social');
const dataRoutes = require('./routes/data');
const uploadRoutes = require('./routes/upload');

const app = express();

// ── Global Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// ── Health Check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'npc-mode-backend', timestamp: new Date().toISOString() });
});

// ── Route Groups ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/upload', uploadRoutes);

// ── 404 Handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Route not found', code: 'NOT_FOUND' });
});

// ── Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
