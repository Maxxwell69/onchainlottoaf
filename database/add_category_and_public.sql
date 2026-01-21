-- Migration: Add category to managed_tokens and is_public to lotto_draws

-- Add category column to managed_tokens (based on coin name/symbol)
ALTER TABLE managed_tokens 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add is_public column to lotto_draws (default false - admin only)
ALTER TABLE lotto_draws 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update existing tokens to have category based on token_name or token_symbol
UPDATE managed_tokens 
SET category = COALESCE(token_name, token_symbol, 'Uncategorized')
WHERE category IS NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_managed_tokens_category ON managed_tokens(category);
CREATE INDEX IF NOT EXISTS idx_lotto_draws_public ON lotto_draws(is_public);
CREATE INDEX IF NOT EXISTS idx_lotto_draws_category ON lotto_draws(token_symbol);
