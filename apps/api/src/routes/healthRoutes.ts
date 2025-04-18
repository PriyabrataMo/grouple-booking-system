import { Router } from "express";
import { Request, Response } from "express";
import { checkRedisHealth } from "../config/redis";
import { restaurantCacheService } from "../services/restaurantCacheService";
import { bookingCacheService } from "../services/bookingCacheService";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";

const router = Router();

/**
 * Basic health check endpoint
 * Public endpoint that returns a simple status
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "grouple-booking-api",
  });
});

/**
 * Detailed application health check
 * Admin only endpoint with detailed information
 */
router.get(
  "/health/detailed",
  authenticateToken,
  authorizeRole(["admin"]),
  async (_: Request, res: Response) => {
    // Get redis health
    const redisHealth = await checkRedisHealth();

    // Get cache metrics
    const restaurantCacheMetrics = restaurantCacheService.getCacheMetrics();
    const bookingCacheMetrics = bookingCacheService.getCacheMetrics();

    // Return comprehensive health information
    res.json({
      application: {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "grouple-booking-api",
        nodeVersion: process.version,
        uptime: process.uptime(), // seconds
      },
      redis: redisHealth,
      cache: {
        restaurant: restaurantCacheMetrics,
        booking: bookingCacheMetrics,
      },
      memory: {
        heap: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        rss: process.memoryUsage().rss / 1024 / 1024, // MB
        external: process.memoryUsage().external / 1024 / 1024, // MB
      },
    });
  }
);

/**
 * Redis health check endpoint
 * Admin only endpoint with detailed Redis information
 */
router.get(
  "/health/redis",
  authenticateToken,
  authorizeRole(["admin"]),
  async (_req: Request, res: Response) => {
    const redisHealth = await checkRedisHealth();
    res.json(redisHealth);
  }
);

/**
 * Cache metrics endpoint
 * Admin only endpoint with cache statistics
 */
router.get(
  "/health/cache/metrics",
  authenticateToken,
  authorizeRole(["admin"]),
  async (_req: Request, res: Response) => {
    const restaurantCacheMetrics = restaurantCacheService.getCacheMetrics();
    const bookingCacheMetrics = bookingCacheService.getCacheMetrics();

    res.json({
      restaurant: restaurantCacheMetrics,
      booking: bookingCacheMetrics,
    });
  }
);

/**
 * Reset cache metrics endpoint
 * Admin only endpoint to reset cache statistics
 */
router.post(
  "/health/cache/reset-metrics",
  authenticateToken,
  authorizeRole(["admin"]),
  async (_req: Request, res: Response) => {
    const restaurantResult = restaurantCacheService.resetCacheMetrics();
    const bookingResult = bookingCacheService.resetCacheMetrics();

    res.json({
      restaurant: restaurantResult,
      booking: bookingResult,
    });
  }
);

export default router;
