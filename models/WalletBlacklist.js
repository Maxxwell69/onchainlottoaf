const { query } = require('../database/db');

class WalletBlacklist {
  // Add wallet to blacklist
  static async add(blacklistData) {
    const { token_id, wallet_address, reason, notes } = blacklistData;

    const sql = `
      INSERT INTO wallet_blacklist (token_id, wallet_address, reason, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (token_id, wallet_address) DO UPDATE
      SET reason = EXCLUDED.reason, notes = EXCLUDED.notes
      RETURNING *
    `;

    const result = await query(sql, [token_id, wallet_address, reason, notes]);
    return result.rows[0];
  }

  // Remove wallet from blacklist
  static async remove(tokenId, walletAddress) {
    const sql = 'DELETE FROM wallet_blacklist WHERE token_id = $1 AND wallet_address = $2';
    await query(sql, [tokenId, walletAddress]);
  }

  // Get blacklist for a token
  static async getByToken(tokenId) {
    const sql = `
      SELECT * FROM wallet_blacklist 
      WHERE token_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [tokenId]);
    return result.rows;
  }

  // Check if wallet is blacklisted for a token
  static async isBlacklisted(tokenId, walletAddress) {
    const sql = `
      SELECT id FROM wallet_blacklist 
      WHERE token_id = $1 AND wallet_address = $2
    `;
    const result = await query(sql, [tokenId, walletAddress]);
    return result.rows.length > 0;
  }

  // Get blacklist by token address
  static async getByTokenAddress(tokenAddress) {
    const sql = `
      SELECT wb.* FROM wallet_blacklist wb
      JOIN managed_tokens mt ON wb.token_id = mt.id
      WHERE mt.token_address = $1
    `;
    const result = await query(sql, [tokenAddress]);
    return result.rows;
  }

  // Bulk add wallets to blacklist
  static async bulkAdd(tokenId, wallets) {
    const values = wallets.map((w, i) => 
      `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`
    ).join(',');
    
    const params = [tokenId];
    wallets.forEach(w => {
      params.push(w.wallet_address, w.reason || 'bulk_add', w.notes || '');
    });

    const sql = `
      INSERT INTO wallet_blacklist (token_id, wallet_address, reason, notes)
      VALUES ${values}
      ON CONFLICT (token_id, wallet_address) DO NOTHING
    `;

    await query(sql, params);
  }

  // Delete blacklist entry
  static async delete(id) {
    const sql = 'DELETE FROM wallet_blacklist WHERE id = $1';
    await query(sql, [id]);
  }
}

module.exports = WalletBlacklist;

