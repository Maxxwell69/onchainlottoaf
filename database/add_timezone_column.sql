-- Migration: Add timezone column to lotto_draws table
-- Run this if you have an existing database and want to add timezone support

-- Add timezone column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lotto_draws' 
        AND column_name = 'timezone'
    ) THEN
        ALTER TABLE lotto_draws ADD COLUMN timezone VARCHAR(50);
    END IF;
END $$;

-- Make min_usd_amount optional (set default to 0)
ALTER TABLE lotto_draws 
ALTER COLUMN min_usd_amount DROP NOT NULL,
ALTER COLUMN min_usd_amount SET DEFAULT 0;

-- Update existing draws to have 0 as min_usd_amount if NULL
UPDATE lotto_draws SET min_usd_amount = 0 WHERE min_usd_amount IS NULL;




