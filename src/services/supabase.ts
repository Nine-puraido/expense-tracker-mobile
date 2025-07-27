import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/supabase';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { config } from '../config/env';
import { validateAndSanitize, safeValidate } from '../utils/validation';
import { rateLimiters } from '../utils/rateLimiter';

export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseAuthService = {
  signUp: async (email: string, password: string, nickname: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname,
        }
      }
    });
    
    if (error) return { data: null, error };
    
    return { data: data.user, error: null };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) return { data: null, error };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    return { 
      data: {
        id: data.user.id,
        email: data.user.email!,
        nickname: profile?.username,
        created_at: data.user.created_at,
      }, 
      error: null 
    };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { data: null, error: null };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      data: {
        id: user.id,
        email: user.email!,
        nickname: profile?.username,
        created_at: user.created_at,
      },
      error: null
    };
  },

  updateProfile: async (updates: { nickname?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ 
          id: user.id,
          username: updates.nickname || user.user_metadata?.nickname || '',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      return { data: newProfile, error: createError };
    }

    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: updates.nickname })
      .eq('id', user.id)
      .select()
      .single();

    return { data, error };
  },

};

export const authService = {
  signUp: async (email: string, password: string, nickname: string) => {
    const rateLimit = rateLimiters.auth(email);
    if (!rateLimit.allowed) {
      return { data: null, error: { message: rateLimit.error || 'Too many requests' } };
    }

    const validation = safeValidate(() => validateAndSanitize.userSignUp({ email, password, nickname }));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid input' } };
    }
    
    const { email: validEmail, password: validPassword, nickname: validNickname } = validation.data!;
    
    let password_hash: string;
    try {
      const saltBytes = await Crypto.getRandomBytesAsync(16);
      const salt = Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      
      password_hash = CryptoJS.PBKDF2(validPassword, salt, {
        keySize: 256/32,
        iterations: 10000
      }).toString() + ':' + salt;
    } catch (cryptoError) {
      return { data: null, error: { message: 'Password hashing failed. Please try again.' } };
    }
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', validEmail)
      .single();
    if (existing) {
      return { data: null, error: { message: 'User already registered' } };
    }
    if (existingError && existingError.code !== 'PGRST116') {
      return { data: null, error: existingError };
    }
    const { data, error } = await supabase
      .from('users')
      .insert({ email: validEmail, password_hash, nickname: validNickname })
      .select()
      .single();
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const rateLimit = rateLimiters.auth(email);
    if (!rateLimit.allowed) {
      return { data: null, error: { message: rateLimit.error || 'Too many requests' } };
    }

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
    
    try {
      const [hash, salt] = data.password_hash.split(':');
      if (!hash || !salt) {
        return { data: null, error: { message: 'Invalid password format in database' } };
      }
      const passwordHash = CryptoJS.PBKDF2(validPassword, salt, {
        keySize: 256/32,
        iterations: 10000
      }).toString();
    
      if (passwordHash !== hash) {
        return { data: null, error: { message: 'Invalid email or password' } };
      }
    } catch (cryptoError) {
      return { data: null, error: { message: 'Authentication failed. Please try again.' } };
    }
    const { password_hash: _, ...user } = data;
    return { data: user, error: null };
  },

  updateUser: async (userId: string, updates: Partial<{ nickname: string; email: string }>) => {
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, email, nickname, created_at')
        .single();
        
      return { data, error };
    } catch (exception) {
      return { data: null, error: { message: 'Failed to update user' } };
    }
  },
};

export const profileService = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  createProfile: async (profile: Database['public']['Tables']['profiles']['Insert']) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    return { data, error };
  },
};

export const categoryService = {
  getCategories: async (userId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    return { data, error };
  },

  createCategory: async (category: Database['public']['Tables']['categories']['Insert']) => {
    const validation = safeValidate(() => validateAndSanitize.category(category));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid category data' } };
    }
    
    const categoryData = {
      ...validation.data!,
      user_id: category.user_id,
      color: category.color || '#007AFF'
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    return { data, error };
  },

  updateCategory: async (categoryId: string, updates: Partial<Database['public']['Tables']['categories']['Update']>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
    return { data, error };
  },

  deleteCategory: async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    return { error };
  },
};

export const transactionService = {
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
        category:categories!transactions_category_id_fkey(*)
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

  createTransaction: async (transaction: Database['public']['Tables']['transactions']['Insert']) => {
    const rateLimit = rateLimiters.transactionCreate(transaction.user_id || 'unknown');
    if (!rateLimit.allowed) {
      return { data: null, error: { message: rateLimit.error || 'Too many requests' } };
    }

    const validation = safeValidate(() => validateAndSanitize.transaction(transaction));
    if (!validation.success) {
      return { data: null, error: { message: validation.error || 'Invalid transaction data' } };
    }
    
    const transactionData = {
      ...validation.data!,
      user_id: transaction.user_id,
      category_id: transaction.category_id
    };
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select(`
        *,
        category:categories!transactions_category_id_fkey(*)
      `)
      .single();
    return { data, error };
  },

  updateTransaction: async (transactionId: string, updates: Partial<Database['public']['Tables']['transactions']['Update']>) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select(`
        *,
        category:categories!transactions_category_id_fkey(*)
      `)
      .single();
    return { data, error };
  },

  deleteTransaction: async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    return { error };
  },

  getAnalytics: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories!transactions_category_id_fkey(*)
      `)
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date');
    return { data, error };
  },
};

export const budgetLimitService = {
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

  deleteBudgetLimit: async (budgetLimitId: string) => {
    const { error } = await supabase
      .from('budget_limits')
      .delete()
      .eq('id', budgetLimitId);
    return { error };
  },
};

export const recurringTransactionService = {
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

  deleteRecurringTransaction: async (recurringTransactionId: string) => {
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', recurringTransactionId);
    return { error };
  },
}; 