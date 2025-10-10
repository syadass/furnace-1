const db = require("../config/db");

const Setpoint = {
  /**
   * Menyimpan data setpoint baru ke database.
   * @param {object} setpointData - Objek yang berisi userID, furnace_id, dan temperature_value.
   * @param {function} callback - Fungsi callback untuk menangani hasil query.
   */
  create: (setpointData, callback) => {
    // Ambil nilai dari objek setpointData
    const { userID, furnace_id, temperature_value } = setpointData;

    // Query INSERT telah diperbarui, 'pressure_value' dihapus
    const query = `
      INSERT INTO setpoint (userID, furnace_id, temperature_value, timestamp)
      VALUES (?, ?, ?, NOW())
    `;
    
    // Array nilai juga disesuaikan
    db.query(query, [userID, furnace_id, temperature_value], callback);
  },

  /**
   * Mengambil semua data setpoint.
   * @param {function} callback - Fungsi callback.
   */
  getAll: (callback) => {
    db.query("SELECT * FROM setpoint ORDER BY timestamp DESC", callback);
  }
};

module.exports = Setpoint;