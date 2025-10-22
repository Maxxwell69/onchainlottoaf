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
      timestamp
    } = entryData;

    const sql = `
      INSERT INTO lotto_entries 
      (draw_id, lotto_number, wallet_address, transaction_signature, token_amount, usd_amount, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        timestamp
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
}

module.exports = LottoEntry;

