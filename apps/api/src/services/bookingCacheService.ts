// BookingCacheService - Handles caching of booking data using Redis
import { redisClient, CACHE_TTL } from "../config/redis";
import { Booking } from "../models";

const CACHE_KEYS = {
  ALL_BOOKINGS: "bookings:all",
  USER_BOOKINGS: (userId: string) => `bookings:user:${userId}`,
  BOOKING_DETAIL: (id: string) => `booking:${id}`,
  ADMIN_BOOKINGS: "bookings:admin",
  RESTAURANT_BOOKINGS: (restaurantId: string) =>
    `bookings:restaurant:${restaurantId}`,
};

// Cache metrics
let cacheHits = 0;
let cacheMisses = 0;

export const bookingCacheService = {
  /**
   * Get all bookings from cache
   */
  async getAllBookings(): Promise<Booking[] | null> {
    try {
      const cachedData = await redisClient.get(CACHE_KEYS.ALL_BOOKINGS);
      if (cachedData) {
        console.log("Cache hit: All bookings");
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error("Error getting bookings from cache:", error);
      return null;
    }
  },

  /**
   * Get user bookings from cache
   */
  async getUserBookings(userId: string): Promise<Booking[] | null> {
    try {
      const cachedData = await redisClient.get(
        CACHE_KEYS.USER_BOOKINGS(userId)
      );
      if (cachedData) {
        console.log(`Cache hit: User ${userId} bookings`);
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error(`Error getting user ${userId} bookings from cache:`, error);
      return null;
    }
  },

  /**
   * Get restaurant bookings from cache
   */
  async getRestaurantBookings(restaurantId: string): Promise<Booking[] | null> {
    try {
      const cachedData = await redisClient.get(
        CACHE_KEYS.RESTAURANT_BOOKINGS(restaurantId)
      );
      if (cachedData) {
        console.log(`Cache hit: Restaurant ${restaurantId} bookings`);
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error(
        `Error getting restaurant ${restaurantId} bookings from cache:`,
        error
      );
      return null;
    }
  },

  /**
   * Get admin bookings from cache
   */
  async getAdminBookings(): Promise<Booking[] | null> {
    try {
      const cachedData = await redisClient.get(CACHE_KEYS.ADMIN_BOOKINGS);
      if (cachedData) {
        console.log("Cache hit: Admin bookings");
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error("Error getting admin bookings from cache:", error);
      return null;
    }
  },

  /**
   * Get booking detail by ID from cache
   */
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const cachedData = await redisClient.get(CACHE_KEYS.BOOKING_DETAIL(id));
      if (cachedData) {
        console.log(`Cache hit: Booking ${id}`);
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error(`Error getting booking ${id} from cache:`, error);
      return null;
    }
  },

  /**
   * Cache all bookings
   */
  async cacheAllBookings(bookings: Booking[]): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.ALL_BOOKINGS,
        CACHE_TTL.BOOKINGS_LIST,
        JSON.stringify(bookings)
      );
      console.log("Cached all bookings");
    } catch (error) {
      console.error("Error caching all bookings:", error);
    }
  },

  /**
   * Cache user bookings
   */
  async cacheUserBookings(userId: string, bookings: Booking[]): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.USER_BOOKINGS(userId),
        CACHE_TTL.BOOKINGS_LIST,
        JSON.stringify(bookings)
      );
      console.log(`Cached user ${userId} bookings`);
    } catch (error) {
      console.error(`Error caching user ${userId} bookings:`, error);
    }
  },

  /**
   * Cache restaurant bookings
   */
  async cacheRestaurantBookings(
    restaurantId: string,
    bookings: Booking[]
  ): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.RESTAURANT_BOOKINGS(restaurantId),
        CACHE_TTL.BOOKINGS_LIST,
        JSON.stringify(bookings)
      );
      console.log(`Cached restaurant ${restaurantId} bookings`);
    } catch (error) {
      console.error(
        `Error caching restaurant ${restaurantId} bookings:`,
        error
      );
    }
  },

  /**
   * Cache admin bookings
   */
  async cacheAdminBookings(bookings: Booking[]): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.ADMIN_BOOKINGS,
        CACHE_TTL.BOOKINGS_LIST,
        JSON.stringify(bookings)
      );
      console.log("Cached admin bookings");
    } catch (error) {
      console.error("Error caching admin bookings:", error);
    }
  },

  /**
   * Cache booking detail
   */
  async cacheBooking(id: string, booking: Booking): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.BOOKING_DETAIL(id),
        CACHE_TTL.BOOKING_DETAIL,
        JSON.stringify(booking)
      );
      console.log(`Cached booking ${id}`);
    } catch (error) {
      console.error(`Error caching booking ${id}:`, error);
    }
  },

  /**
   * Invalidate booking caches when data changes
   * Target can be: "all", "user", "restaurant", "admin", or a specific booking ID
   */
  async invalidateBookingCache(target: string, subId?: string): Promise<void> {
    try {
      if (target === "all") {
        // Invalidate all booking-related caches
        await redisClient.del(CACHE_KEYS.ALL_BOOKINGS);
        await redisClient.del(CACHE_KEYS.ADMIN_BOOKINGS);
        console.log("Invalidated all booking caches");
        return;
      }

      if (target === "user" && subId) {
        // Invalidate specific user bookings
        await redisClient.del(CACHE_KEYS.USER_BOOKINGS(subId));
        // Also invalidate all and admin bookings as they might be affected
        await redisClient.del(CACHE_KEYS.ALL_BOOKINGS);
        await redisClient.del(CACHE_KEYS.ADMIN_BOOKINGS);
        console.log(`Invalidated user ${subId} booking cache`);
        return;
      }

      if (target === "restaurant" && subId) {
        // Invalidate specific restaurant bookings
        await redisClient.del(CACHE_KEYS.RESTAURANT_BOOKINGS(subId));
        // Also invalidate all and admin bookings as they might be affected
        await redisClient.del(CACHE_KEYS.ALL_BOOKINGS);
        await redisClient.del(CACHE_KEYS.ADMIN_BOOKINGS);
        console.log(`Invalidated restaurant ${subId} booking cache`);
        return;
      }

      if (target === "admin") {
        // Invalidate admin bookings
        await redisClient.del(CACHE_KEYS.ADMIN_BOOKINGS);
        console.log("Invalidated admin booking cache");
        return;
      }

      // Assume target is a booking ID if none of the above
      await redisClient.del(CACHE_KEYS.BOOKING_DETAIL(target));
      // Also invalidate all booking lists as they might contain this booking
      await redisClient.del(CACHE_KEYS.ALL_BOOKINGS);
      await redisClient.del(CACHE_KEYS.ADMIN_BOOKINGS);

      // If this booking has associated user/restaurant, invalidate those too
      const booking = await Booking.findByPk(parseInt(target));
      if (booking) {
        if (booking.userId) {
          await redisClient.del(
            CACHE_KEYS.USER_BOOKINGS(booking.userId.toString())
          );
        }
        if (booking.restaurantId) {
          await redisClient.del(
            CACHE_KEYS.RESTAURANT_BOOKINGS(booking.restaurantId.toString())
          );
        }
      }

      console.log(`Invalidated cache for booking ${target}`);
    } catch (error) {
      console.error(`Error invalidating booking cache (${target}):`, error);
    }
  },

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    const total = cacheHits + cacheMisses;
    return {
      hits: cacheHits,
      misses: cacheMisses,
      total: total,
      hitRate: total > 0 ? (cacheHits / total) * 100 : 0,
      missRate: total > 0 ? (cacheMisses / total) * 100 : 0,
    };
  },

  /**
   * Reset cache metrics
   */
  resetCacheMetrics() {
    cacheHits = 0;
    cacheMisses = 0;
    return { message: "Booking cache metrics reset successfully" };
  },
};
