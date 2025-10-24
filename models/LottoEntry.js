const { query } = require('../database/db');

class LottoEntry {
  // Create a new entry
  static async create(entryData) {
    const {
      draw_id,
      lotto_number,
      wallet_address,
      transaction_signature,
      token_amount,
      usd_amount,
      timestamp,
      notes = null,
      verified = true
    } = entryData;

    const sql = `
      INSERT INTO lotto_entries 
      (draw_id, lotto_number, wallet_address, transaction_signature, token_amount, usd_amount, timestamp, notes, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        draw_id,
        lotto_number,
        wallet_address,
        transaction_signature,
        token_amount,
        usd_amount,
        timestamp,
        notes,
        verified
      ]);

      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }
  }

  // Get entries by draw ID
  static async getByDrawId(drawId) {
    const sql = `
      SELECT * FROM lotto_entries 
      WHERE draw_id = $1 
      ORDER BY lotto_number ASC
    `;
    const result = await query(sql, [drawId]);
    return result.rows;
  }

  // Get next available lotto number for a draw
  static async getNextLottoNumber(drawId) {
    const sql = `
      SELECT lotto_number FROM lotto_entries 
      WHERE draw_id = $1 
      ORDER BY lotto_number ASC
    `;
    const result = await query(sql, [drawId]);
    const usedNumbers = result.rows.map(row => row.lotto_number);

    // Find first available number from 1-69
    for (let i = 1; i <= 69; i++) {
      if (!usedNumbers.includes(i)) {
        return i;
      }
    }

    return null; // All slots filled
  }

  // Check if transaction already exists in a specific draw
  static async existsBySignature(signature, drawId) {
    const sql = 'SELECT id FROM lotto_entries WHERE transaction_signature = $1 AND draw_id = $2';
    const result = await query(sql, [signature, drawId]);
    return result.rows.length > 0;
  }

  // Check if transaction already exists in ANY draw (global uniqueness)
  static async existsGloballyBySignature(signature) {
    const sql = 'SELECT id, draw_id FROM lotto_entries WHERE transaction_signature = $1';
    const result = await query(sql, [signature]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all entries for a wallet in a specific draw (multiple entries allowed)
  static async getByWalletAndDraw(walletAddress, drawId) {
    const sql = 'SELECT * FROM lotto_entries WHERE wallet_address = $1 AND draw_id = $2 ORDER BY timestamp ASC';
    const result = await query(sql, [walletAddress, drawId]);
    return result.rows;
  }

  // Get entry by transaction signature
  static async getBySignature(signature) {
    const sql = 'SELECT * FROM lotto_entries WHERE transaction_signature = $1';
    const result = await query(sql, [signature]);
    return result.rows[0];
  }

  // Count entries for a draw
  static async countByDrawId(drawId) {
    const sql = 'SELECT COUNT(*) as count FROM lotto_entries WHERE draw_id = $1';
    const result = await query(sql, [drawId]);
    return parseInt(result.rows[0].count);
  }

  // Get entry by wallet address and draw ID
  static async getByWalletAndDraw(walletAddress, drawId) {
    const sql = `
      SELECT * FROM lotto_entries 
      WHERE wallet_address = $1 AND draw_id = $2
    `;
    const result = await query(sql, [walletAddress, drawId]);
    return result.rows[0] || null;
  }

  // Update verification status
  static async updateVerification(entryId, verified) {
    const sql = `
      UPDATE lotto_entries 
      SET verified = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [verified, entryId]);
    return result.rows[0];
  }

  // Get entry by transaction signature
  static async getByTransactionSignature(signature) {
    const sql = `
      SELECT * FROM lotto_entries 
      WHERE transaction_signature = $1
    `;
    const result = await query(sql, [signature]);
    return result.rows[0] || null;
  }

  // Delete an entry
  static async delete(entryId) {
    const sql = 'DELETE FROM lotto_entries WHERE id = $1';
    await query(sql, [entryId]);
    return true;
  }

  // Get next available lotto number for a draw
  static async getNextLottoNumber(drawId) {
    const sql = `
      SELECT COALESCE(MAX(lotto_number), 0) + 1 as next_number 
      FROM lotto_entries 
      WHERE draw_id = $1
    `;
    const result = await query(sql, [drawId]);
    return parseInt(result.rows[0].next_number);
  }

  // Update lotto number for an entry
  static async updateLottoNumber(entryId, newLottoNumber) {
    const sql = 'UPDATE lotto_entries SET lotto_number = $1 WHERE id = $2';
    const result = await query(sql, [newLottoNumber, entryId]);
    return result.rowCount > 0;
  }
}

module.exports = LottoEntry;

