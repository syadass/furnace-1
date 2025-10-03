const db = require("../config/db");

const Setpoint = {
  // PERBAIKI: Tambahkan 'furnace_id' sebagai parameter kedua
  create: (userID, furnace_id, pressure_value, temperature_value, callback) => {
    // PERBAIKI: Tambahkan kolom 'furnace_id' di dalam query INSERT
    const query = `
      INSERT INTO setpoint (userID, furnace_id, pressure_value, temperature_value, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    // PERBAIKI: Tambahkan variabel 'furnace_id' ke dalam array nilai
    db.query(query, [userID, furnace_id, pressure_value, temperature_value], callback);
  },

  getAll: (callback) => {
    db.query("SELECT * FROM setpoint ORDER BY timestamp DESC", callback);
  }
};

module.exports = Setpoint;