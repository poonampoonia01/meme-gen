import request from 'supertest';
import { createApp } from '../app';

const { app, server, io } = createApp();

describe('API Endpoints', () => {
  afterAll((done) => {
    io.close();
    server.close(done);
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('redis');
    });
  });

  describe('GET /api/tokens', () => {
    it('should return paginated tokens', async () => {
      const response = await request(app).get('/api/tokens');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 30000);

    it('should handle limit parameter', async () => {
      const response = await request(app).get('/api/tokens?limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    }, 30000);

    it('should handle sorting parameters', async () => {
      const response = await request(app)
        .get('/api/tokens?sortBy=volume&sortOrder=desc&limit=10');
      
      expect(response.status).toBe(200);
      const tokens = response.body.data;
      
      if (tokens.length > 1) {
        for (let i = 1; i < tokens.length; i++) {
          expect(tokens[i - 1].volume_sol).toBeGreaterThanOrEqual(tokens[i].volume_sol);
        }
      }
    }, 30000);

    it('should handle cursor-based pagination', async () => {
      const response1 = await request(app).get('/api/tokens?limit=5');
      expect(response1.status).toBe(200);
      
      if (response1.body.next_cursor) {
        const response2 = await request(app)
          .get(`/api/tokens?limit=5&cursor=${response1.body.next_cursor}`);
        
        expect(response2.status).toBe(200);
        expect(response2.body.data.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('POST /api/tokens/refresh', () => {
    it('should refresh cache', async () => {
      const response = await request(app).post('/api/tokens/refresh');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    }, 30000);
  });

  describe('GET /api/tokens/:address', () => {
    it('should return 404 for non-existent token', async () => {
      const response = await request(app).get('/api/tokens/invalid-address');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    }, 30000);
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});

