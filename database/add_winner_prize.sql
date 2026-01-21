-- Add prize column to lotto_entries for winner selection
ALTER TABLE lotto_entries 
ADD COLUMN IF NOT EXISTS prize VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;

-- Create index for faster winner queries
CREATE INDEX IF NOT EXISTS idx_lotto_entries_is_winner ON lotto_entries(is_winner);
CREATE INDEX IF NOT EXISTS idx_lotto_entries_prize ON lotto_entries(prize) WHERE prize IS NOT NULL;
