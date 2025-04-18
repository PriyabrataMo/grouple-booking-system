import { createClient } from 'redis';

// Redis client configuration
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000), // Reconnect strategy
  }
});

// Connect to Redis
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Initialize redis connection
export const initRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Application can still function without Redis
  }
};

// TTL in seconds for cache items
export const CACHE_TTL = {
  RESTAURANTS: 60 * 5, // 5 minutes for restaurants list
  RESTAURANT_DETAIL: 60 * 10, // 10 minutes for restaurant details
  BOOKINGS_LIST: 60 * 3, // 3 minutes for booking lists
  BOOKING_DETAIL: 60 * 5, // 5 minutes for booking details
};

/**
 * Check Redis health status
 * Tests connection, PING response, and optionally gets memory usage stats
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    pingResponse?: string;
    memoryUsage?: string | undefined;
    uptime?: string | undefined;
    keyCount?: number;
    error?: string;
  };
}> {
  try {
    // Test connection
    const isConnected = redisClient.isOpen;
    
    // Only proceed with tests if connected
    if (!isConnected) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: 'Redis client is not connected'
        }
      };
    }
    
    // Test basic functionality with PING
    const pingResponse = await redisClient.ping();
    
    // Get server info
    const infoResponse = await redisClient.info();
    const infoLines = infoResponse.split('\r\n');
    
    // Parse memory usage
    const memoryUsage = infoLines
      .find(line => line.startsWith('used_memory_human:'))
      ?.split(':')[1]?.trim();
    
    // Parse uptime
    const uptimeSeconds = infoLines
      .find(line => line.startsWith('uptime_in_seconds:'))
      ?.split(':')[1]?.trim();
    const uptime = uptimeSeconds ? formatUptime(parseInt(uptimeSeconds)) : undefined;
    
    // Get key count
    const keyCount = await redisClient.dbSize();
    
    return {
      status: pingResponse === 'PONG' ? 'healthy' : 'unhealthy',
      details: {
        connected: true,
        pingResponse,
        memoryUsage,
        uptime,
        keyCount
      }
    };
  } catch (error) {
    console.error('Redis health check failed:', error);
    return {
      status: 'unhealthy',
      details: {
        connected: redisClient.isOpen || false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Format uptime from seconds to human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}