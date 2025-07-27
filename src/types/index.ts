export type TransactionType = 'expense' | 'income';
export type ImportanceLevel = 'essential' | 'wants' | 'extra';
export type BudgetPeriod = 'monthly' | 'yearly';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface BudgetLimit {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category_id: string;
  amount: number;
  description?: string | null;
  importance?: ImportanceLevel;
  transaction_date: string;
  recurring_transaction_id?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category_id: string;
  amount: number;
  description?: string;
  importance?: ImportanceLevel;
  frequency: RecurringFrequency;
  day_of_month?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface BudgetLimitWithCategory extends BudgetLimit {
  category: Category;
}

export interface AnalyticsData {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  categoryBreakdown: Array<{
    category: Category;
    amount: number;
    percentage: number;
  }>;
  monthlyData: Array<{
    month: string;
    expenses: number;
    income: number;
  }>;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
}

export interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
} 