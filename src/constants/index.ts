import { ThemeColors } from '../types';

export const DEFAULT_CATEGORIES = [
  { name: 'Transportation', color: '#FF6B6B', icon: 'car' },
  { name: 'Food', color: '#4ECDC4', icon: 'restaurant' },
  { name: 'Clothes', color: '#45B7D1', icon: 'shirt' },
  { name: 'Gadget', color: '#96CEB4', icon: 'laptop' },
  { name: 'Grocery', color: '#FFEAA7', icon: 'shopping-cart' },
  { name: 'Rent', color: '#DDA0DD', icon: 'home' },
  { name: 'Bills', color: '#98D8C8', icon: 'file-text' },
  { name: 'Health', color: '#FF9500', icon: 'medical-outline' },
];

export const IMPORTANCE_LEVELS = [
  { value: 'essential', label: 'Essential', color: '#FF6B6B' },
  { value: 'wants', label: 'Wants', color: '#4ECDC4' },
  { value: 'extra', label: 'Extra', color: '#45B7D1' },
];

export const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const BUDGET_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const LIGHT_THEME: ThemeColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

export const DARK_THEME: ThemeColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
};

export const CHART_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

export const STORAGE_KEYS = {
  THEME: 'app_theme',
  USER_PROFILE: 'user_profile',
  OFFLINE_TRANSACTIONS: 'offline_transactions',
  LAST_SYNC: 'last_sync',
};

export const API_ENDPOINTS = {
  EXCHANGE_RATE: 'https://api.exchangerate-api.com/v4/latest/THB',
};

export const NOTIFICATION_TYPES = {
  BUDGET_LIMIT: 'budget_limit',
  RECURRING_TRANSACTION: 'recurring_transaction',
  SYNC_COMPLETE: 'sync_complete',
}; 