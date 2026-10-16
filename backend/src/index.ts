import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import artistRoutes from './routes/artistRoutes.js';
import graphRoutes from './routes/graphRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import releaseRoutes from './routes/releaseRoutes.js';
import recordingRoutes from './routes/recordingRoutes.js';
import { closeDriver } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes API
app.use('/api/artists', artistRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/recordings', recordingRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API MusicGraph !',
    endpoints: {
      artists: '/api/artists',
      graph: '/api/graph',
      stats: '/api/stats'
    }
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`[Server] API MusicGraph démarrée sur le port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Server] Arrêt en cours...');
  server.close(async () => {
    console.log('[Server] Serveur Express arrêté');
    await closeDriver();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
