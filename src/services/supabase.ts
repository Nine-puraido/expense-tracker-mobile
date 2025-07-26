import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/supabase';
import bcrypt from 'bcrypt';
import { config } from '../config/env';
import { validateAndSanitize, safeValidate } from '../utils/validation';
import { rateLimiters } from '../utils/rateLimiter';

// Initialize Supabase client with secure environment configuration
export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Custom Auth service using users table
export const authService = {
  // Sign up: hash password and insert user
  signUp: async (email: string, password: string, nickname: string) => {
    // Check rate limit
    const rateLimit = rateLimiters.auth(email);
    if (!rateLimit.allowed) {
      return { data: null, error: { message: rateLimit.error || 'Too many requests' } };
    }

    // Validate and sanitize input
    const validation = safeValidate(() => validateAndSanitize.userSignUp({ email, password, nickname }));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid input' } };
    }
    
    const { email: validEmail, password: validPassword, nickname: validNickname } = validation.data!;
    
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(validPassword, saltRounds);
    // Check if user already exists
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', validEmail)
      .single();
    if (existing) {
      return { data: null, error: { message: 'User already registered' } };
    }
    if (existingError && existingError.code !== 'PGRST116') {
      // Ignore "No rows found" error
      return { data: null, error: existingError };
    }
    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert({ email: validEmail, password_hash, nickname: validNickname })
      .select()
      .single();
    return { data, error };
  },

  // Sign in: fetch user and compare hash
  signIn: async (email: string, password: string) => {
    // Check rate limit
    const rateLimit = rateLimiters.auth(email);
    if (!rateLimit.allowed) {
      return { data: null, error: { message: rateLimit.error || 'Too many requests' } };
    }

    // Validate and sanitize input
    const validation = safeValidate(() => validateAndSanitize.userSignIn({ email, password }));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid input' } };
    }
    
    const { email: validEmail, password: validPassword } = validation.data!;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', validEmail)
      .single();
    if (error) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
    if (!data) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
    
    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(validPassword, data.password_hash);
    if (!isPasswordValid) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
    // Success: return user data (omit password_hash)
    const { password_hash: _, ...user } = data;
    return { data: user, error: null };
  },
};

// Profile service
export const profileService = {
  // Get user profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Create user profile
  createProfile: async (profile: Database['public']['Tables']['profiles']['Insert']) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    return { data, error };
  },
};

// Categories service
export const categoryService = {
  // Get user categories
  getCategories: async (userId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    return { data, error };
  },

  // Create category
  createCategory: async (category: Database['public']['Tables']['categories']['Insert']) => {
    // Validate and sanitize input
    const validation = safeValidate(() => validateAndSanitize.category(category));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid category data' } };
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert(validation.data!)
      .select()
      .single();
    return { data, error };
  },

  // Update category
  updateCategory: async (categoryId: string, updates: Partial<Database['public']['Tables']['categories']['Update']>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
    return { data, error };
  },

  // Delete category
  deleteCategory: async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    return { error };
  },
};

// Transactions service
export const transactionService = {
  // Get user transactions
  getTransactions: async (userId: string, filters?: {
    type?: 'expense' | 'income';
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  }) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Create transaction
  createTransaction: async (transaction: Database['public']['Tables']['transactions']['Insert']) => {
    // Check rate limit
    const rateLimit = rateLimiters.transactionCreate(transaction.user_id || 'unknown');
    if (!rateLimit.allowed) {
      return { data: null, error: { message: rateLimit.error || 'Too many requests' } };
    }

    // Validate and sanitize input
    const validation = safeValidate(() => validateAndSanitize.transaction(transaction));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid transaction data' } };
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(validation.data!)
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    return { data, error };
  },

  // Update transaction
  updateTransaction: async (transactionId: string, updates: Partial<Database['public']['Tables']['transactions']['Update']>) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    return { data, error };
  },

  // Delete transaction
  deleteTransaction: async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    return { error };
  },

  // Get analytics data
  getAnalytics: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date');
    return { data, error };
  },
};

// Budget limits service
export const budgetLimitService = {
  // Get user budget limits
  getBudgetLimits: async (userId: string) => {
    const { data, error } = await supabase
      .from('budget_limits')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId);
    return { data, error };
  },

  // Create budget limit
  createBudgetLimit: async (budgetLimit: Database['public']['Tables']['budget_limits']['Insert']) => {
    const { data, error } = await supabase
      .from('budget_limits')
      .insert(budgetLimit)
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    return { data, error };
  },

  // Update budget limit
  updateBudgetLimit: async (budgetLimitId: string, updates: Partial<Database['public']['Tables']['budget_limits']['Update']>) => {
    const { data, error } = await supabase
      .from('budget_limits')
      .update(updates)
      .eq('id', budgetLimitId)
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    return { data, error };
  },

  // Delete budget limit
  deleteBudgetLimit: async (budgetLimitId: string) => {
    const { error } = await supabase
      .from('budget_limits')
      .delete()
      .eq('id', budgetLimitId);
    return { error };
  },
};

// Recurring transactions service
export const recurringTransactionService = {
  // Get user recurring transactions
  getRecurringTransactions: async (userId: string) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    return { data, error };
  },

  // Create recurring transaction
  createRecurringTransaction: async (recurringTransaction: Database['public']['Tables']['recurring_transactions']['Insert']) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(recurringTransaction)
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    return { data, error };
  },

  // Update recurring transaction
  updateRecurringTransaction: async (recurringTransactionId: string, updates: Partial<Database['public']['Tables']['recurring_transactions']['Update']>) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', recurringTransactionId)
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    return { data, error };
  },

  // Delete recurring transaction
  deleteRecurringTransaction: async (recurringTransactionId: string) => {
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', recurringTransactionId);
    return { error };
  },
}; 