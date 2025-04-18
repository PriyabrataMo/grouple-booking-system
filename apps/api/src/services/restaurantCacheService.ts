import { redisClient, CACHE_TTL } from "../config/redis";
import Restaurant from "../models/Restaurant";
import { RestaurantWithTables } from "../types/restaurant.types";

const CACHE_KEYS = {
  ALL_RESTAURANTS: "restaurants:all",
  RESTAURANT_DETAIL: (id: string) => `restaurant:${id}`,
};

// Cache metrics
let cacheHits = 0;
let cacheMisses = 0;

export const restaurantCacheService = {
  /**
   * Get all restaurants from cache
   */
  async getAllRestaurants(): Promise<Restaurant[] | null> {
    try {
      const cachedData = await redisClient.get(CACHE_KEYS.ALL_RESTAURANTS);
      if (cachedData) {
        console.log("Cache hit: All restaurants");
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error("Error getting restaurants from cache:", error);
      return null;
    }
  },

  /**
   * Cache all restaurants
   */
  async cacheAllRestaurants(restaurants: Restaurant[]): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.ALL_RESTAURANTS,
        CACHE_TTL.RESTAURANTS,
        JSON.stringify(restaurants)
      );
      console.log("Cached all restaurants");
    } catch (error) {
      console.error("Error caching restaurants:", error);
    }
  },

  /**
   * Get restaurant detail by ID from cache
   */
  async getRestaurantById(id: string): Promise<RestaurantWithTables | null> {
    try {
      const cachedData = await redisClient.get(
        CACHE_KEYS.RESTAURANT_DETAIL(id)
      );
      if (cachedData) {
        console.log(`Cache hit: Restaurant ${id}`);
        cacheHits++;
        return JSON.parse(cachedData);
      }
      cacheMisses++;
      return null;
    } catch (error) {
      console.error(`Error getting restaurant ${id} from cache:`, error);
      return null;
    }
  },

  /**
   * Cache restaurant detail
   */
  async cacheRestaurant(
    id: string,
    restaurant: RestaurantWithTables
  ): Promise<void> {
    try {
      await redisClient.setEx(
        CACHE_KEYS.RESTAURANT_DETAIL(id),
        CACHE_TTL.RESTAURANT_DETAIL,
        JSON.stringify(restaurant)
      );
      console.log(`Cached restaurant ${id}`);
    } catch (error) {
      console.error(`Error caching restaurant ${id}:`, error);
    }
  },

  /**
   * Invalidate restaurant cache when data changes
   */
  async invalidateRestaurantCache(id: string): Promise<void> {
    try {
      if (id === "all") {
        // Only invalidate the all restaurants list
        await redisClient.del(CACHE_KEYS.ALL_RESTAURANTS);
        console.log("Invalidated all restaurants cache");
        return;
      }

      // Invalidate specific restaurant
      await redisClient.del(CACHE_KEYS.RESTAURANT_DETAIL(id));
      // Invalidate all restaurants list as it might contain the updated restaurant
      await redisClient.del(CACHE_KEYS.ALL_RESTAURANTS);
      console.log(`Invalidated cache for restaurant ${id}`);
    } catch (error) {
      console.error(`Error invalidating cache for restaurant ${id}:`, error);
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
    return { message: "Cache metrics reset successfully" };
  },
};
