/**
 * Token blacklist utility for tracking invalidated JWT tokens
 * This provides server-side logout functionality
 */

class TokenBlacklist {
  private blacklistedTokens: Map<string, number> = new Map();

  /**
   * Add a token to the blacklist with expiry time
   * @param token JWT token to blacklist
   * @param expiryTimestamp Unix timestamp when token will expire
   */
  addToken(token: string, expiryTimestamp: number): void {
    this.blacklistedTokens.set(token, expiryTimestamp);

    // Schedule cleanup of expired tokens
    this.cleanupExpiredTokens();
  }

  /**
   * Check if a token is blacklisted (logged out)
   * @param token JWT token to check
   * @returns boolean indicating if token is blacklisted
   */
  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Remove expired tokens from blacklist
   * This runs automatically when tokens are added to prevent memory leaks
   */
  private cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);

    for (const [token, expiry] of this.blacklistedTokens.entries()) {
      if (expiry <= now) {
        this.blacklistedTokens.delete(token);
      }
    }

    // Also schedule periodic cleanup
    setTimeout(() => this.cleanupExpiredTokens(), 3600000); // Run every hour
  }

  /**
   * Get the current count of blacklisted tokens (for testing/debugging)
   */
  get size(): number {
    return this.blacklistedTokens.size;
  }
}

// Create singleton instance
export const tokenBlacklist = new TokenBlacklist();
