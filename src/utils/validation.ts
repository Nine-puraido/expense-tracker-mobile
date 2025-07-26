import { z } from 'zod';
import validator from 'validator';

// Validation schemas using Zod
export const userSignUpSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .refine((email) => validator.isEmail(email), 'Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  nickname: z.string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname too long')
    .regex(/^[a-zA-Z0-9_\s]+$/, 'Nickname can only contain letters, numbers, underscores, and spaces')
});

export const userSignInSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required')
});

export const transactionSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999, 'Amount too large')
    .refine((val) => Number.isFinite(val), 'Invalid amount'),
  description: z.string()
    .min(1, 'Description is required')
    .max(255, 'Description too long')
    .refine((desc) => validator.escape(desc.trim()).length > 0, 'Invalid description'),
  category_id: z.string()
    .uuid('Invalid category ID')
    .min(1, 'Category is required'),
  transaction_date: z.string()
    .refine((date) => validator.isISO8601(date), 'Invalid date format'),
  type: z.enum(['expense', 'income'], {
    message: 'Type must be either expense or income'
  }),
  importance: z.enum(['essential', 'wants', 'extra'], {
    message: 'Importance must be essential, wants, or extra'
  }).optional()
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name too long')
    .regex(/^[a-zA-Z0-9\s&-]+$/, 'Category name contains invalid characters'),
  type: z.enum(['expense', 'income'], {
    message: 'Type must be either expense or income'
  }),
  icon: z.string()
    .min(1, 'Icon is required')
    .max(50, 'Icon name too long')
    .optional()
});

export const budgetLimitSchema = z.object({
  category_id: z.string()
    .uuid('Invalid category ID'),
  amount: z.number()
    .positive('Budget limit must be positive')
    .max(999999999, 'Budget limit too large'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    message: 'Period must be daily, weekly, monthly, or yearly'
  })
});

// Input sanitization functions
export const sanitizeInput = {
  email: (email: string): string => {
    return validator.normalizeEmail(email.trim().toLowerCase()) || '';
  },
  
  text: (text: string): string => {
    return validator.escape(text.trim());
  },
  
  nickname: (nickname: string): string => {
    return validator.escape(nickname.trim().replace(/[^a-zA-Z0-9_\s]/g, ''));
  },
  
  amount: (amount: string): number => {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
  },
  
  description: (description: string): string => {
    return validator.escape(description.trim().substring(0, 255));
  }
};

// Validation helper functions
export const validateAndSanitize = {
  userSignUp: (data: any) => {
    const sanitized = {
      email: sanitizeInput.email(data.email || ''),
      password: data.password || '',
      nickname: sanitizeInput.nickname(data.nickname || '')
    };
    
    return {
      success: true,
      data: userSignUpSchema.parse(sanitized)
    };
  },
  
  userSignIn: (data: any) => {
    const sanitized = {
      email: sanitizeInput.email(data.email || ''),
      password: data.password || ''
    };
    
    return {
      success: true,
      data: userSignInSchema.parse(sanitized)
    };
  },
  
  transaction: (data: any) => {
    const sanitized = {
      amount: typeof data.amount === 'string' ? sanitizeInput.amount(data.amount) : data.amount,
      description: sanitizeInput.description(data.description || ''),
      category_id: data.category_id || '',
      transaction_date: data.transaction_date || '',
      type: data.type || '',
      importance: data.importance || undefined
    };
    
    return {
      success: true,
      data: transactionSchema.parse(sanitized)
    };
  },
  
  category: (data: any) => {
    const sanitized = {
      name: sanitizeInput.text(data.name || ''),
      type: data.type || '',
      icon: data.icon || undefined
    };
    
    return {
      success: true,
      data: categorySchema.parse(sanitized)
    };
  },
  
  budgetLimit: (data: any) => {
    const sanitized = {
      category_id: data.category_id || '',
      amount: typeof data.amount === 'string' ? sanitizeInput.amount(data.amount) : data.amount,
      period: data.period || ''
    };
    
    return {
      success: true,
      data: budgetLimitSchema.parse(sanitized)
    };
  }
};

// Error handling wrapper
export const safeValidate = <T>(
  validationFn: () => { success: boolean; data: T },
  fallback?: T
): { success: boolean; data?: T; error?: string } => {
  try {
    const result = validationFn();
    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        data: fallback
      };
    }
    return {
      success: false,
      error: 'Validation failed',
      data: fallback
    };
  }
};