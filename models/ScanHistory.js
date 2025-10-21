const { query } = require('../database/db');

class ScanHistory {
  // Create scan history record
  static async create(scanData) {
    const { draw_id, last_signature, transactions_found } = scanData;

    const sql = `
      INSERT INTO scan_history (draw_id, last_signature, transactions_found)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await query(sql, [draw_id, last_signature, transactions_found]);
    return result.rows[0];
  }

  // Get last scan for a draw
  static async getLastScan(drawId) {
    const sql = `
      SELECT * FROM scan_history 
      WHERE draw_id = $1 
      ORDER BY scan_time DESC 
      LIMIT 1
    `;
    const result = await query(sql, [drawId]);
    return result.rows[0];
  }

  // Get all scans for a draw
  static async getByDrawId(drawId) {
    const sql = `
      SELECT * FROM scan_history 
      WHERE draw_id = $1 
      ORDER BY scan_time DESC
    `;
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = ScanHistory;

