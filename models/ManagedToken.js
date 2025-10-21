const { query } = require('../database/db');

class ManagedToken {
  // Create a new managed token
  static async create(tokenData) {
    const { token_address, token_symbol, token_name, notes } = tokenData;

    const sql = `
      INSERT INTO managed_tokens (token_address, token_symbol, token_name, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(sql, [token_address, token_symbol, token_name, notes]);
    return result.rows[0];
  }

  // Get token by ID
  static async getById(tokenId) {
    const sql = 'SELECT * FROM managed_tokens WHERE id = $1';
    const result = await query(sql, [tokenId]);
    return result.rows[0];
  }

  // Get token by address
  static async getByAddress(tokenAddress) {
    const sql = 'SELECT * FROM managed_tokens WHERE token_address = $1';
    const result = await query(sql, [tokenAddress]);
    return result.rows[0];
  }

  // Get all tokens
  static async getAll() {
    const sql = 'SELECT * FROM managed_tokens ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
  }

  // Get active tokens
  static async getActive() {
    const sql = 'SELECT * FROM managed_tokens WHERE is_active = true ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
  }

  // Update token
  static async update(tokenId, updates) {
    const { token_symbol, token_name, is_active, notes } = updates;
    
    const sql = `
      UPDATE managed_tokens 
      SET token_symbol = COALESCE($1, token_symbol),
          token_name = COALESCE($2, token_name),
          is_active = COALESCE($3, is_active),
          notes = COALESCE($4, notes)
      WHERE id = $5
      RETURNING *
    `;

    const result = await query(sql, [token_symbol, token_name, is_active, notes, tokenId]);
    return result.rows[0];
  }

  // Delete token
  static async delete(tokenId) {
    const sql = 'DELETE FROM managed_tokens WHERE id = $1';
    await query(sql, [tokenId]);
  }

  // Get token with blacklist count
  static async getWithBlacklistCount(tokenId) {
    const sql = `
      SELECT mt.*, 
             COUNT(wb.id) as blacklist_count
      FROM managed_tokens mt
      LEFT JOIN wallet_blacklist wb ON mt.id = wb.token_id
      WHERE mt.id = $1
      GROUP BY mt.id
    `;
    const result = await query(sql, [tokenId]);
    return result.rows[0];
  }
}

module.exports = ManagedToken;

