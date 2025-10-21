-- Token Manager Tables

-- Table for managed tokens
CREATE TABLE IF NOT EXISTS managed_tokens (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(44) NOT NULL UNIQUE,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for blacklisted wallets (per token)
CREATE TABLE IF NOT EXISTS wallet_blacklist (
    id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES managed_tokens(id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL,
    reason VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_token_wallet UNIQUE (token_id, wallet_address)
);

-- Indexes
CREATE INDEX idx_managed_tokens_address ON managed_tokens(token_address);
CREATE INDEX idx_managed_tokens_active ON managed_tokens(is_active);
CREATE INDEX idx_wallet_blacklist_token ON wallet_blacklist(token_id);
CREATE INDEX idx_wallet_blacklist_wallet ON wallet_blacklist(wallet_address);

-- Trigger for updated_at
CREATE TRIGGER update_managed_tokens_updated_at 
    BEFORE UPDATE ON managed_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

