-- Essential indexes for expense tracker with few users
-- Run these in your Supabase SQL editor

-- 1. Main index for user transactions (most important)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, transaction_date DESC);

-- 2. Index for filtering by transaction type
CREATE INDEX IF NOT EXISTS idx_transactions_user_type 
ON transactions(user_id, type);

-- 3. Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_category 
ON transactions(user_id, category_id);

-- 4. Index for date range queries (analytics)
CREATE INDEX IF NOT EXISTS idx_transactions_date 
ON transactions(transaction_date DESC);

-- 5. Categories index (if you plan to have many categories)
CREATE INDEX IF NOT EXISTS idx_categories_type 
ON categories(type);

-- Check existing indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('transactions', 'categories', 'users')
ORDER BY tablename, indexname;