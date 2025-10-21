-- On Chain Lotto Database Schema

-- Table for Lotto Draws
CREATE TABLE IF NOT EXISTS lotto_draws (
    id SERIAL PRIMARY KEY,
    draw_name VARCHAR(255) NOT NULL,
    token_address VARCHAR(44) NOT NULL,
    token_symbol VARCHAR(20),
    min_usd_amount DECIMAL(10, 2) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    total_slots INTEGER DEFAULT 69,
    filled_slots INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Lotto Entries (Qualified Buys)
CREATE TABLE IF NOT EXISTS lotto_entries (
    id SERIAL PRIMARY KEY,
    draw_id INTEGER REFERENCES lotto_draws(id) ON DELETE CASCADE,
    lotto_number INTEGER NOT NULL,
    wallet_address VARCHAR(44) NOT NULL,
    transaction_signature VARCHAR(88) NOT NULL UNIQUE,
    token_amount DECIMAL(20, 8) NOT NULL,
    usd_amount DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_draw_number UNIQUE (draw_id, lotto_number)
);

-- Table for Transaction Scan History
CREATE TABLE IF NOT EXISTS scan_history (
    id SERIAL PRIMARY KEY,
    draw_id INTEGER REFERENCES lotto_draws(id) ON DELETE CASCADE,
    last_signature VARCHAR(88),
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transactions_found INTEGER DEFAULT 0
);

-- Indexes for better query performance
CREATE INDEX idx_lotto_draws_status ON lotto_draws(status);
CREATE INDEX idx_lotto_draws_token ON lotto_draws(token_address);
CREATE INDEX idx_lotto_entries_draw ON lotto_entries(draw_id);
CREATE INDEX idx_lotto_entries_wallet ON lotto_entries(wallet_address);
CREATE INDEX idx_scan_history_draw ON scan_history(draw_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_lotto_draws_updated_at 
    BEFORE UPDATE ON lotto_draws 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

