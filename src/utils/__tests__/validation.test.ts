import {
  validateAndSanitize,
  sanitizeInput,
  safeValidate,
} from '../validation';

describe('Validation Utils', () => {
  describe('sanitizeInput', () => {
    it('should sanitize email correctly', () => {
      expect(sanitizeInput.email('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeInput.email('user+tag@domain.com')).toBe('user@domain.com');
    });

    it('should sanitize text correctly', () => {
      expect(sanitizeInput.text('  <script>alert("test")</script>  ')).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeInput.text('Normal text')).toBe('Normal text');
    });

    it('should sanitize nickname correctly', () => {
      expect(sanitizeInput.nickname('  user@#$  ')).toBe('user');
      expect(sanitizeInput.nickname('user_123')).toBe('user_123');
    });

    it('should sanitize amount correctly', () => {
      expect(sanitizeInput.amount('$123.45')).toBe(123.45);
      expect(sanitizeInput.amount('-50')).toBe(50);
      expect(sanitizeInput.amount('invalid')).toBe(0);
    });
  });

  describe('validateAndSanitize.userSignUp', () => {
    it('should validate valid user signup data', () => {
      const result = validateAndSanitize.userSignUp({
        email: 'test@example.com',
        password: 'Password123',
        nickname: 'testuser'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'test@example.com',
        password: 'Password123',
        nickname: 'testuser'
      });
    });

    it('should reject invalid email', () => {
      expect(() => {
        validateAndSanitize.userSignUp({
          email: 'invalid-email',
          password: 'Password123',
          nickname: 'testuser'
        });
      }).toThrow();
    });

    it('should reject weak password', () => {
      expect(() => {
        validateAndSanitize.userSignUp({
          email: 'test@example.com',
          password: 'weak',
          nickname: 'testuser'
        });
      }).toThrow();
    });

    it('should reject invalid nickname', () => {
      expect(() => {
        validateAndSanitize.userSignUp({
          email: 'test@example.com',
          password: 'Password123',
          nickname: ''
        });
      }).toThrow();
    });
  });

  describe('validateAndSanitize.transaction', () => {
    it('should validate valid transaction data', () => {
      const result = validateAndSanitize.transaction({
        amount: 100.50,
        description: 'Test transaction',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        transaction_date: '2023-01-01',
        type: 'expense',
        importance: 'essential'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(100.50);
      expect(result.data.type).toBe('expense');
    });

    it('should reject negative amount', () => {
      expect(() => {
        validateAndSanitize.transaction({
          amount: -100,
          description: 'Test transaction',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          transaction_date: '2023-01-01',
          type: 'expense'
        });
      }).toThrow();
    });

    it('should reject invalid category ID', () => {
      expect(() => {
        validateAndSanitize.transaction({
          amount: 100,
          description: 'Test transaction',
          category_id: 'invalid-uuid',
          transaction_date: '2023-01-01',
          type: 'expense'
        });
      }).toThrow();
    });

    it('should reject invalid transaction type', () => {
      expect(() => {
        validateAndSanitize.transaction({
          amount: 100,
          description: 'Test transaction',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          transaction_date: '2023-01-01',
          type: 'invalid'
        });
      }).toThrow();
    });
  });

  describe('safeValidate', () => {
    it('should handle successful validation', () => {
      const result = safeValidate(() => ({ success: true, data: 'test' }));
      expect(result.success).toBe(true);
      expect(result.data).toBe('test');
      expect(result.error).toBeUndefined();
    });

    it('should handle validation errors gracefully', () => {
      const result = safeValidate(() => {
        throw new Error('Validation failed');
      }, 'fallback');
      
      expect(result.success).toBe(false);
      expect(result.data).toBe('fallback');
      expect(result.error).toBe('Validation failed');
    });
  });
});