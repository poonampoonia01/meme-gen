import cacheService from '../services/cache.service';

describe('CacheService', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  afterAll(async () => {
    await cacheService.close();
  });

  it('should set and get a value', async () => {
    const key = 'test-key';
    const value = { data: 'test-value' };

    await cacheService.set(key, value);
    const result = await cacheService.get(key);

    expect(result).toEqual(value);
  });

  it('should return null for non-existent key', async () => {
    const result = await cacheService.get('non-existent');
    expect(result).toBeNull();
  });

  it('should delete a key', async () => {
    const key = 'test-delete';
    await cacheService.set(key, 'value');
    await cacheService.del(key);
    
    const result = await cacheService.get(key);
    expect(result).toBeNull();
  });

  it('should handle TTL expiration', async () => {
    const key = 'test-ttl';
    await cacheService.set(key, 'value', 1); // 1 second TTL

    const immediate = await cacheService.get(key);
    expect(immediate).toBe('value');

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const expired = await cacheService.get(key);
    expect(expired).toBeNull();
  }, 10000);

  it('should handle cache errors gracefully', async () => {
    // Test with invalid data shouldn't crash
    await expect(cacheService.set('test', undefined as any)).resolves.not.toThrow();
  });
});

