-- Add title column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Transaction';

-- Update existing transactions to have a title
UPDATE transactions 
SET title = CASE 
  WHEN type = 'income' THEN 'Income'
  WHEN type = 'expense' THEN 'Expense'
  ELSE 'Transaction'
END
WHERE title IS NULL OR title = 'Transaction';