import { checkRateLimit, rateLimiters, RATE_LIMITS, resetUserRateLimits } from '../rateLimiter';

// Mock setTimeout and clearInterval for testing
jest.useFakeTimers();

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Reset any rate limits after each test
    resetUserRateLimits('test-user');
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const rule = {
        maxRequests: 5,
        windowMs: 60000,
        keyGenerator: () => 'test-key'
      };

      const result1 = checkRateLimit(rule);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit(rule);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should block requests when limit exceeded', () => {
      const rule = {
        maxRequests: 2,
        windowMs: 60000,
        keyGenerator: () => 'test-key'
      };

      // First two requests should be allowed
      const result1 = checkRateLimit(rule);
      expect(result1.allowed).toBe(true);

      const result2 = checkRateLimit(rule);
      expect(result2.allowed).toBe(true);

      // Third request should be blocked
      const result3 = checkRateLimit(rule);
      expect(result3.allowed).toBe(false);
      expect(result3.error).toContain('Rate limit exceeded');
    });

    it('should reset after time window expires', () => {
      const rule = {
        maxRequests: 1,
        windowMs: 1000,
        keyGenerator: () => 'test-key'
      };

      // First request should be allowed
      const result1 = checkRateLimit(rule);
      expect(result1.allowed).toBe(true);

      // Second request should be blocked
      const result2 = checkRateLimit(rule);
      expect(result2.allowed).toBe(false);

      // Fast forward time beyond window
      jest.advanceTimersByTime(1001);

      // Request should be allowed again
      const result3 = checkRateLimit(rule);
      expect(result3.allowed).toBe(true);
    });
  });

  describe('rateLimiters.auth', () => {
    it('should limit authentication attempts per email', () => {
      const email = 'test@example.com';

      // Should allow first few attempts
      for (let i = 0; i < 5; i++) {
        const result = rateLimiters.auth(email);
        expect(result.allowed).toBe(true);
      }

      // Should block the 6th attempt
      const result = rateLimiters.auth(email);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should have separate limits for different emails', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Exhaust limit for email1
      for (let i = 0; i < 5; i++) {
        rateLimiters.auth(email1);
      }
      const result1 = rateLimiters.auth(email1);
      expect(result1.allowed).toBe(false);

      // email2 should still be allowed
      const result2 = rateLimiters.auth(email2);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('rateLimiters.transactionCreate', () => {
    it('should limit transaction creation per user', () => {
      const userId = 'user-123';

      // Should allow many transactions within limit
      for (let i = 0; i < 50; i++) {
        const result = rateLimiters.transactionCreate(userId);
        expect(result.allowed).toBe(true);
      }

      // Should block the 51st transaction
      const result = rateLimiters.transactionCreate(userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('resetUserRateLimits', () => {
    it('should reset all rate limits for a user', () => {
      const userId = 'user-123';

      // Exhaust transaction limit
      for (let i = 0; i < 50; i++) {
        rateLimiters.transactionCreate(userId);
      }
      
      let result = rateLimiters.transactionCreate(userId);
      expect(result.allowed).toBe(false);

      // Reset limits
      resetUserRateLimits(userId);

      // Should be allowed again
      result = rateLimiters.transactionCreate(userId);
      expect(result.allowed).toBe(true);
    });
  });
});