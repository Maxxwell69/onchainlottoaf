const { query } = require('../database/db');

class LottoDraw {
  // Create a new lotto draw
  static async create(drawData) {
    const {
      draw_name,
      token_address,
      token_symbol,
      min_usd_amount,
      timezone,
      start_time,
      prize_description_short,
      prize_description_long,
      is_public
    } = drawData;

    // Validate and format start_time
    let formattedStartTime = start_time;
    if (typeof start_time === 'string') {
      // Handle format: "YYYY-MM-DD HH:MM:SS"
      if (start_time.includes(' ')) {
        formattedStartTime = start_time;
      } 
      // Handle format: "YYYY-MM-DDTHH:MM:SS"
      else if (start_time.includes('T')) {
        formattedStartTime = start_time.replace('T', ' ').replace(/\.\d{3}Z?$/, '');
      }
    }

    const sql = `
      INSERT INTO lotto_draws (draw_name, token_address, token_symbol, min_usd_amount, timezone, start_time, prize_description_short, prize_description_long, is_public)
      VALUES ($1, $2, $3, $4, $5, $6::timestamp without time zone, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        draw_name,
        token_address,
        token_symbol || null,
        min_usd_amount,
        timezone || null,
        formattedStartTime,
        prize_description_short || null,
        prize_description_long || null,
        is_public || false
      ]);
      return result.rows[0];
    } catch (dbError) {
      console.error('Database error creating draw:', dbError);
      console.error('SQL:', sql);
      console.error('Parameters:', [draw_name, token_address, token_symbol, min_usd_amount, timezone, formattedStartTime, prize_description_short, prize_description_long]);
      throw dbError;
    }

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
  // Draws remain visible (including completed) until admin explicitly marks as drawn, deactivates (cancelled), or deletes them
  static async getActive() {
    const sql = `
      SELECT *, start_time::text as start_time_text FROM lotto_draws 
      WHERE status IN ('active', 'completed')
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows.map(draw => {
      draw.start_time = draw.start_time_text;
      delete draw.start_time_text;
      return draw;
    });
  }
  
  // Get public active draws (for public pages)
  static async getPublicActive() {
    const sql = `
      SELECT *, start_time::text as start_time_text FROM lotto_draws 
      WHERE status IN ('active', 'completed') AND is_public = true
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows.map(draw => {
      draw.start_time = draw.start_time_text;
      delete draw.start_time_text;
      return draw;
    });
  }
  
  // Get public active draws by category (token_symbol)
  static async getPublicActiveByCategory(category) {
    const sql = `
      SELECT d.*, d.start_time::text as start_time_text 
      FROM lotto_draws d
      JOIN managed_tokens mt ON d.token_address = mt.token_address
      WHERE d.status IN ('active', 'completed') 
        AND d.is_public = true 
        AND mt.category = $1
      ORDER BY d.created_at DESC
    `;
    const result = await query(sql, [category]);
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
  // Note: Status remains unchanged - admin must manually mark as completed
  static async updateFilledSlots(drawId, filledSlots) {
    const sql = `
      UPDATE lotto_draws 
      SET filled_slots = $1, 
          end_time = CASE WHEN $1 >= total_slots THEN CURRENT_TIMESTAMP ELSE end_time END
      WHERE id = $2 
      RETURNING *
    `;
    const result = await query(sql, [filledSlots, drawId]);
    return result.rows[0];
  }

  // Update prize descriptions
  static async updatePrizes(drawId, prizeDescriptionShort, prizeDescriptionLong) {
    const sql = `
      UPDATE lotto_draws 
      SET prize_description_short = $1, 
          prize_description_long = $2
      WHERE id = $3 
      RETURNING *
    `;
    const result = await query(sql, [prizeDescriptionShort || null, prizeDescriptionLong || null, drawId]);
    return result.rows[0];
  }
  
  // Update is_public status
  static async updatePublicStatus(drawId, isPublic) {
    const sql = `
      UPDATE lotto_draws 
      SET is_public = $1
      WHERE id = $2 
      RETURNING *
    `;
    const result = await query(sql, [isPublic, drawId]);
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

