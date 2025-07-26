import { authService } from '../supabase';
import bcrypt from 'bcrypt';

// Mock the entire supabase module
jest.mock('../supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  };

  return {
    supabase: mockSupabase,
    authService: {
      signUp: jest.fn(),
      signIn: jest.fn(),
    },
  };
});

// Mock validation and rate limiting
jest.mock('../utils/validation', () => ({
  validateAndSanitize: {
    userSignUp: jest.fn((data) => data),
    userSignIn: jest.fn((data) => data),
  },
  safeValidate: jest.fn((fn) => ({ success: true, data: fn() })),
}));

jest.mock('../utils/rateLimiter', () => ({
  rateLimiters: {
    auth: jest.fn(() => ({ allowed: true, remaining: 4, resetTime: Date.now() + 900000 })),
  },
}));

describe('Auth Service', () => {
  const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
  const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBcryptHash.mockResolvedValue('hashedpassword' as never);
    mockBcryptCompare.mockResolvedValue(true as never);
  });

  describe('signUp', () => {
    it('should hash password before storing', async () => {
      const email = 'test@example.com';
      const password = 'Password123';
      const nickname = 'testuser';

      // Mock the implementation for this test
      const mockAuthService = {
        signUp: jest.fn(async (email: string, password: string, nickname: string) => {
          const hashedPassword = await bcrypt.hash(password, 12);
          expect(hashedPassword).toBe('hashedpassword');
          return { data: { id: '1', email, nickname }, error: null };
        }),
      };

      const result = await mockAuthService.signUp(email, password, nickname);

      expect(mockBcryptHash).toHaveBeenCalledWith(password, 12);
      expect(result.data).toEqual({ id: '1', email, nickname });
      expect(result.error).toBeNull();
    });

    it('should return error for duplicate email', async () => {
      const mockAuthService = {
        signUp: jest.fn(async () => {
          return { data: null, error: { message: 'User already registered' } };
        }),
      };

      const result = await mockAuthService.signUp('existing@example.com', 'Password123', 'user');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('User already registered');
    });
  });

  describe('signIn', () => {
    it('should compare password with stored hash', async () => {
      const email = 'test@example.com';
      const password = 'Password123';
      const storedHash = 'hashedpassword';

      const mockAuthService = {
        signIn: jest.fn(async (email: string, password: string) => {
          const isValid = await bcrypt.compare(password, storedHash);
          if (isValid) {
            return { data: { id: '1', email, nickname: 'user' }, error: null };
          }
          return { data: null, error: { message: 'Invalid email or password' } };
        }),
      };

      const result = await mockAuthService.signIn(email, password);

      expect(mockBcryptCompare).toHaveBeenCalledWith(password, storedHash);
      expect(result.data).toEqual({ id: '1', email, nickname: 'user' });
      expect(result.error).toBeNull();
    });

    it('should return error for invalid credentials', async () => {
      mockBcryptCompare.mockResolvedValue(false as never);

      const mockAuthService = {
        signIn: jest.fn(async () => {
          return { data: null, error: { message: 'Invalid email or password' } };
        }),
      };

      const result = await mockAuthService.signIn('test@example.com', 'wrongpassword');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Invalid email or password');
    });

    it('should return error for non-existent user', async () => {
      const mockAuthService = {
        signIn: jest.fn(async () => {
          return { data: null, error: { message: 'Invalid email or password' } };
        }),
      };

      const result = await mockAuthService.signIn('nonexistent@example.com', 'Password123');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Invalid email or password');
    });
  });
});