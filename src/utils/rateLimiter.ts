interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context?: any) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  check(key: string, rule: RateLimitRule): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + rule.windowMs
      };
      this.storage.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    if (entry.count >= rule.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    entry.count++;
    this.storage.set(key, entry);

    return {
      allowed: true,
      remaining: rule.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  reset(key: string) {
    this.storage.delete(key);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}

const globalRateLimiter = new RateLimiter();

export const RATE_LIMITS = {
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (email?: string) => `auth:${email || 'unknown'}`
  },
  TRANSACTION_CREATE: {
    maxRequests: 50,
    windowMs: 60 * 1000,
    keyGenerator: (userId?: string) => `transaction_create:${userId || 'unknown'}`
  },
  CATEGORY_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyGenerator: (userId?: string) => `category_create:${userId || 'unknown'}`
  },
  PROFILE_UPDATE: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyGenerator: (userId?: string) => `profile_update:${userId || 'unknown'}`
  },
  DATA_FETCH: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    keyGenerator: (userId?: string) => `data_fetch:${userId || 'unknown'}`
  }
} as const;

export const checkRateLimit = (
  rule: RateLimitRule,
  context?: any
): { allowed: boolean; remaining: number; resetTime: number; error?: string } => {
  const key = rule.keyGenerator ? rule.keyGenerator(context) : 'default';
  const result = globalRateLimiter.check(key, rule);
  
  if (!result.allowed) {
    const resetTimeSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    return {
      ...result,
      error: `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`
    };
  }
  
  return result;
};

export const rateLimiters = {
  auth: (email: string) => checkRateLimit(RATE_LIMITS.AUTH, email),
  transactionCreate: (userId: string) => checkRateLimit(RATE_LIMITS.TRANSACTION_CREATE, userId),
  categoryCreate: (userId: string) => checkRateLimit(RATE_LIMITS.CATEGORY_CREATE, userId),
  profileUpdate: (userId: string) => checkRateLimit(RATE_LIMITS.PROFILE_UPDATE, userId),
  dataFetch: (userId: string) => checkRateLimit(RATE_LIMITS.DATA_FETCH, userId)
};

export const resetUserRateLimits = (userId: string) => {
  Object.values(RATE_LIMITS).forEach(rule => {
    if (rule.keyGenerator) {
      const key = rule.keyGenerator(userId);
      globalRateLimiter.reset(key);
    }
  });
};

export const cleanupRateLimiter = () => {
  globalRateLimiter.destroy();
};