const db = require("../config/db");

const Setpoint = {
  create: (userID, pressure_value, temperature_value, callback) => {
    const query = `
      INSERT INTO setpoint (userID, pressure_value, temperature_value, timestamp)
      VALUES (?, ?, ?, NOW())
    `;
    db.query(query, [userID, pressure_value, temperature_value], callback);
  },

  getAll: (callback) => {
    db.query("SELECT * FROM setpoint ORDER BY timestamp DESC", callback);
  }
};

module.exports = Setpoint;
