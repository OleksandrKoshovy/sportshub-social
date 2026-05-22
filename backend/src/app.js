require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');

const authRoutes    = require('./routes/auth');
const eventRoutes   = require('./routes/events');
const userRoutes    = require('./routes/users');
const ratingRoutes  = require('./routes/ratings');
const adminRoutes   = require('./routes/admin');
const uploadRoutes  = require('./routes/upload');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Azure Cosmos DB ─────────────────────────────────────────
const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'sportshub');

app.locals.db = {
  users:          database.container('users'),
  events:         database.container('events'),
  ratings:        database.container('ratings'),
  participations: database.container('participations'),
  eventPhotos:    database.container('event-photos'),
  sports:         database.container('sports'),
};

// ── Azure Blob Storage ──────────────────────────────────────
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.BLOB_CONNECTION_STRING
);
app.locals.blobService    = blobServiceClient;
app.locals.photosContainer = blobServiceClient.getContainerClient('event-photos');
app.locals.avatarsContainer = blobServiceClient.getContainerClient('avatars');

// ── Rotas ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/events',  eventRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/upload',  uploadRoutes);

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await database.read();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { cosmosDB: 'connected', blobStorage: 'connected' },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

// ── Erro global ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SportsHub API a correr em http://localhost:${PORT}`);
  console.log(`📊 Cosmos DB: ${process.env.COSMOS_DATABASE || 'sportshub'}`);
});

module.exports = app;
