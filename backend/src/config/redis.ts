import Redis from 'ioredis';
import { logger } from '@utils/logger';
import { config } from '@config/config';

const redisClient = new Redis({
  host: config.REDIS.HOST,
  port: config.REDIS.PORT,
  // Add password or other options if necessary
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

export default redisClient;
