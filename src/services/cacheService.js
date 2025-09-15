const { LRUCache } = require('lru-cache');
const { redisClient } = require('../config/redis');

// Why: High-performance caching layer for API responses
// What: LRU cache with Redis fallback for scalability
class CacheService {
  constructor() {
    // In-memory LRU cache (fast access)
    this.memoryCache = new LRUCache({
      max: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
      ttl: parseInt(process.env.CACHE_TTL) * 1000 || 300000, // Convert to milliseconds
    });
  }

  // Generate cache key with tenant isolation
  generateKey(tenantId, type, params = {}) {
    const paramStr = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
    return `tenant:${tenantId}:${type}:${paramStr}`;
  }

  // Get from cache (try memory first, then Redis)
  async get(tenantId, type, params = {}) {
    const key = this.generateKey(tenantId, type, params);
    
    // Try memory cache first (fastest)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult) {
      console.log(`🔥 Cache HIT (Memory): ${key}`);
      return memoryResult;
    }

    // Try Redis cache (if available)
    if (redisClient) {
      try {
        const redisResult = await redisClient.get(key);
        if (redisResult) {
          const parsed = JSON.parse(redisResult);
          // Store back in memory for faster access
          this.memoryCache.set(key, parsed);
          console.log(`🔥 Cache HIT (Redis): ${key}`);
          return parsed;
        }
      } catch (error) {
        console.warn('Redis get error:', error.message);
      }
    }

    console.log(`❄️ Cache MISS: ${key}`);
    return null;
  }

  // Set cache (both memory and Redis)
  async set(tenantId, type, data, params = {}) {
    const key = this.generateKey(tenantId, type, params);
    
    // Store in memory cache
    this.memoryCache.set(key, data);
    
    // Store in Redis (if available)
    if (redisClient) {
      try {
        await redisClient.setEx(
          key, 
          parseInt(process.env.CACHE_TTL) || 300, 
          JSON.stringify(data)
        );
        console.log(`💾 Cache SET: ${key}`);
      } catch (error) {
        console.warn('Redis set error:', error.message);
      }
    }
  }

  // Clear cache for specific tenant
  async clearTenant(tenantId) {
    // Clear memory cache (partial clear)
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`tenant:${tenantId}:`)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache (if available)
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`tenant:${tenantId}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
        console.log(`🗑️ Cache CLEARED for tenant: ${tenantId}`);
      } catch (error) {
        console.warn('Redis clear error:', error.message);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.memoryCache.max,
        calculatedSize: this.memoryCache.calculatedSize
      },
      redisConnected: !!redisClient
    };
  }
}

module.exports = new CacheService();
