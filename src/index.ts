import { createApp } from './app';
import { config } from './config';
import websocketService from './services/websocket.service';
import cacheService from './services/cache.service';
import logger from './utils/logger';

async function startServer() {
  try {
    const { app, server, io } = createApp();

    // Initialize WebSocket service
    websocketService.initialize(io);

    // Start server
    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 REST API: http://localhost:${config.port}/api`);
      logger.info(`🔌 WebSocket: ws://localhost:${config.port}`);
      logger.info(`💾 Redis: ${cacheService.getStatus() ? 'Connected' : 'Disconnected'}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      websocketService.stop();
      await cacheService.close();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

