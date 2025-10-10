const db = require('../config/db');

const LogData = {
  getAll: (callback) => {
    db.query('SELECT * FROM logdata', callback);
  },

  getByUser: (userID, callback) => {
    db.query('SELECT * FROM logdata WHERE userID = ?', [userID], callback);
  },

  getLogsByUserAndFurnace: (userID, furnace_id, callback) => {
    const query = 'SELECT * FROM logdata WHERE userID = ? AND furnace_id = ? ORDER BY timestamp ASC';
    db.query(query, [userID, furnace_id], callback);
  },

  getLogsByUserAndFurnaceForDate: (userID, furnace_id, date, callback) => {
    const query = `
        SELECT * FROM logdata 
        WHERE userID = ? AND furnace_id = ? AND DATE(timestamp) = ? 
        ORDER BY timestamp ASC
    `;
    db.query(query, [userID, furnace_id, date], callback);
  },

  create: (data, callback) => {
    const { userID, pressure_value, temperature_value, furnace_id, nama_lengkap } = data;
    const sql = 'INSERT INTO logdata (userID, pressure_value, temperature_value, furnace_id, nama_lengkap) VALUES (?, ?, ?, ?, ?)';
    
    db.query(
      sql,
      [userID, pressure_value, temperature_value, furnace_id, nama_lengkap],
      callback
    );
  },

  update: (logID, data, callback) => {
    const { pressure_value, temperature_value } = data;
    db.query(
      'UPDATE logdata SET pressure_value = ?, temperature_value = ? WHERE logID = ?',
      [pressure_value, temperature_value, logID],
      callback
    );
  },

  delete: (logID, callback) => {
    db.query('DELETE FROM logdata WHERE logID = ?', [logID], callback);
  }
};

module.exports = LogData;