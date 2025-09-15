const redis = require('redis');

// Why: Redis client for caching and async job processing  
// What: Configured Redis connection with error handling
let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis connection failed, continuing without cache:', error.message);
    return null;
  }
};

module.exports = { connectRedis, redisClient };
