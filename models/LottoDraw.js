const { query } = require('../database/db');

class LottoDraw {
  // Create a new lotto draw
  static async create(drawData) {
    const {
      draw_name,
      token_address,
      token_symbol,
      min_usd_amount,
      start_time
    } = drawData;

    const sql = `
      INSERT INTO lotto_draws (draw_name, token_address, token_symbol, min_usd_amount, start_time)
      VALUES ($1, $2, $3, $4, $5::timestamp without time zone)
      RETURNING *
    `;

    const result = await query(sql, [
      draw_name,
      token_address,
      token_symbol,
      min_usd_amount,
      start_time
    ]);

    return result.rows[0];
  }

  // Get draw by ID
  static async getById(drawId) {
    const sql = 'SELECT *, start_time::text as start_time_text FROM lotto_draws WHERE id = $1';
    const result = await query(sql, [drawId]);
    const draw = result.rows[0];
    if (draw) {
      // Convert the text timestamp back to a proper format
      draw.start_time = draw.start_time_text;
      delete draw.start_time_text;
    }
    return draw;
  }

  // Get all draws
  static async getAll() {
    const sql = 'SELECT *, start_time::text as start_time_text FROM lotto_draws ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows.map(draw => {
      draw.start_time = draw.start_time_text;
      delete draw.start_time_text;
      return draw;
    });
  }

  // Get active draws
  static async getActive() {
    const sql = `
      SELECT *, start_time::text as start_time_text FROM lotto_draws 
      WHERE status = 'active' 
      AND filled_slots < total_slots
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows.map(draw => {
      draw.start_time = draw.start_time_text;
      delete draw.start_time_text;
      return draw;
    });
  }

  // Update draw status
  static async updateStatus(drawId, status) {
    const sql = 'UPDATE lotto_draws SET status = $1 WHERE id = $2 RETURNING *';
    const result = await query(sql, [status, drawId]);
    return result.rows[0];
  }

  // Update filled slots
  static async updateFilledSlots(drawId, filledSlots) {
    const sql = `
      UPDATE lotto_draws 
      SET filled_slots = $1, 
          status = CASE WHEN $1 >= total_slots THEN 'completed' ELSE status END,
          end_time = CASE WHEN $1 >= total_slots THEN CURRENT_TIMESTAMP ELSE end_time END
      WHERE id = $2 
      RETURNING *
    `;
    const result = await query(sql, [filledSlots, drawId]);
    return result.rows[0];
  }

  // Get draw with entries
  static async getWithEntries(drawId) {
    const drawSql = 'SELECT *, start_time::text as start_time_text FROM lotto_draws WHERE id = $1';
    const entriesSql = `
      SELECT * FROM lotto_entries 
      WHERE draw_id = $1 
      ORDER BY lotto_number ASC
    `;

    const [drawResult, entriesResult] = await Promise.all([
      query(drawSql, [drawId]),
      query(entriesSql, [drawId])
    ]);

    if (drawResult.rows.length === 0) {
      return null;
    }

    const draw = drawResult.rows[0];
    const entries = entriesResult.rows;

    // Convert the text timestamp back to a proper format
    draw.start_time = draw.start_time_text;
    delete draw.start_time_text;

    return {
      ...draw,
      entries
    };
  }
}

module.exports = LottoDraw;

