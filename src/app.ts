import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import tokenRoutes from './routes/tokens.routes';
import healthRoutes from './routes/health.routes';
import logger from './utils/logger';
import { config } from './config';

export function createApp(): { app: Application; server: any; io: SocketIOServer } {
  const app = express();
  const server = createServer(app);
  
  // Determine CORS origin: use first allowed origin or '*' if wildcard
  const corsOrigin = config.allowedOrigins.includes('*') 
    ? '*' 
    : config.allowedOrigins.length > 0 
      ? config.allowedOrigins 
      : '*';
  
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('public'));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/tokens', tokenRoutes);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Meme Coin Aggregator API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        tokens: '/api/tokens',
        tokenByAddress: '/api/tokens/:address',
        refreshCache: 'POST /api/tokens/refresh',
        websocket: 'ws://localhost:3000',
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  });

  return { app, server, io };
}

