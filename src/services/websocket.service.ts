import { Server as SocketIOServer } from 'socket.io';
import cron from 'node-cron';
import aggregationService from './aggregation.service';
import logger from '../utils/logger';
import { config } from '../config';

class WebSocketService {
  private io: SocketIOServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private cronJob: cron.ScheduledTask | null = null;

  initialize(io: SocketIOServer): void {
    this.io = io;
    this.setupConnectionHandlers();
    this.startPeriodicUpdates();
    this.startCacheRefresh();
    logger.info('WebSocket service initialized');
  }

  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Send initial data
      this.sendTokenUpdates(socket);

      // Handle filter requests
      socket.on('filter', async (filter) => {
        logger.info(`Filter request from ${socket.id}:`, filter);
        const result = await aggregationService.getTokens(filter);
        socket.emit('tokens', result);
      });

      // Handle token subscription
      socket.on('subscribe', (tokenAddress) => {
        logger.info(`Client ${socket.id} subscribed to ${tokenAddress}`);
        socket.join(`token:${tokenAddress}`);
      });

      socket.on('unsubscribe', (tokenAddress) => {
        logger.info(`Client ${socket.id} unsubscribed from ${tokenAddress}`);
        socket.leave(`token:${tokenAddress}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async sendTokenUpdates(socket?: any): Promise<void> {
    try {
      const tokens = await aggregationService.getTokens({ limit: 30 });
      
      if (socket) {
        // Send to specific socket
        socket.emit('tokens', tokens);
      } else if (this.io) {
        // Broadcast to all connected clients
        this.io.emit('tokens', tokens);
      }
    } catch (error) {
      logger.error('Error sending token updates:', error);
    }
  }

  private startPeriodicUpdates(): void {
    // Send updates every 5 seconds
    this.updateInterval = setInterval(async () => {
      await this.sendTokenUpdates();
    }, config.wsUpdateInterval);

    logger.info(`Started periodic updates every ${config.wsUpdateInterval}ms`);
  }

  private startCacheRefresh(): void {
    // Refresh cache every 30 seconds
    this.cronJob = cron.schedule('*/30 * * * * *', async () => {
      try {
        await aggregationService.refreshCache();
        logger.info('Cache refreshed via cron');
      } catch (error) {
        logger.error('Cache refresh error:', error);
      }
    });

    logger.info('Cache refresh cron job started');
  }

  async broadcastPriceUpdate(tokenAddress: string, newPrice: number): Promise<void> {
    if (!this.io) return;

    this.io.to(`token:${tokenAddress}`).emit('price_update', {
      token_address: tokenAddress,
      price_sol: newPrice,
      timestamp: Date.now(),
    });
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    logger.info('WebSocket service stopped');
  }
}

export default new WebSocketService();

