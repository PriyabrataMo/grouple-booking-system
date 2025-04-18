import { Router } from "express";
import { Request, Response } from "express";
import { checkRedisHealth } from "../config/redis";
import { restaurantCacheService } from "../services/restaurantCacheService";
import { bookingCacheService } from "../services/bookingCacheService";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health checks
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     description: Public endpoint that returns a simple status indicating the API is running.
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: grouple-booking-api
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "grouple-booking-api",
  });
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed application health check (Admin only)
 *     tags: [Health]
 *     description: Provides detailed health information about the application, Node.js environment, Redis connection, cache metrics, and memory usage. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     service:
 *                       type: string
 *                     nodeVersion:
 *                       type: string
 *                     uptime:
 *                       type: number
 *                       description: Process uptime in seconds
 *                 redis:
 *                   type: object # Define Redis health schema if needed
 *                 cache:
 *                   type: object
 *                   properties:
 *                     restaurant:
 *                       type: object # Define cache metrics schema if needed
 *                     booking:
 *                       type: object # Define cache metrics schema if needed
 *                 memory:
 *                   type: object
 *                   properties:
 *                     heap:
 *                       type: number
 *                       description: Heap usage in MB
 *                     rss:
 *                       type: number
 *                       description: Resident Set Size in MB
 *                     external:
 *                       type: number
 *                       description: External memory usage in MB
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Server error during health check
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
 * @swagger
 * /api/health/redis:
 *   get:
 *     summary: Redis health check (Admin only)
 *     tags: [Health]
 *     description: Checks the status and gathers information about the Redis connection. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Redis health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Define Redis health schema if needed
 *               properties:
 *                 status:
 *                   type: string
 *                   example: connected
 *                 pingResponse:
 *                   type: string
 *                   example: PONG
 *                 info:
 *                   type: object
 *                   description: Selected info from Redis INFO command
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Error checking Redis health
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
 * @swagger
 * /api/health/cache/metrics:
 *   get:
 *     summary: Get cache metrics (Admin only)
 *     tags: [Health]
 *     description: Retrieves current cache hit/miss statistics for restaurant and booking caches. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache metrics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   type: object # Define cache metrics schema if needed
 *                   properties:
 *                     hits:
 *                       type: integer
 *                     misses:
 *                       type: integer
 *                     hitRate:
 *                       type: number
 *                       format: float
 *                 booking:
 *                   type: object # Define cache metrics schema if needed
 *                   properties:
 *                     hits:
 *                       type: integer
 *                     misses:
 *                       type: integer
 *                     hitRate:
 *                       type: number
 *                       format: float
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Error retrieving cache metrics
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
 * @swagger
 * /api/health/cache/reset-metrics:
 *   post:
 *     summary: Reset cache metrics (Admin only)
 *     tags: [Health]
 *     description: Resets the hit/miss counters for both restaurant and booking caches. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache metrics reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Restaurant cache metrics reset.
 *                 booking:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Booking cache metrics reset.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Error resetting cache metrics
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
