const db = require('../config/db');

const LogData = {
  getAll: (callback) => {
    db.query('SELECT * FROM LogData', callback);
  },

  getByUser: (userID, callback) => {
    db.query('SELECT * FROM LogData WHERE userID = ?', [userID], callback);
  },

  getLogsByUserAndFurnace: (userID, furnace_id, callback) => {
    const query = 'SELECT * FROM LogData WHERE userID = ? AND furnace_id = ? ORDER BY timestamp ASC';
    db.query(query, [userID, furnace_id], callback);
  },

  // Fungsi untuk mengambil log berdasarkan user, furnace, dan tanggal
  getLogsByUserAndFurnaceForDate: (userID, furnace_id, date, callback) => {
    // Menggunakan fungsi DATE() dari SQL untuk mencocokkan tanggal saja
    const query = `
        SELECT * FROM LogData 
        WHERE userID = ? AND furnace_id = ? AND DATE(timestamp) = ? 
        ORDER BY timestamp ASC
    `;
    db.query(query, [userID, furnace_id, date], callback);
  },

  create: (data, callback) => {
    const { userID, pressure_value, temperature_value, furnace_id } = data; 
    db.query(
      'INSERT INTO LogData (userID, pressure_value, temperature_value, furnace_id) VALUES (?, ?, ?, ?)',
      [userID, pressure_value, temperature_value, furnace_id],
      callback
    );
  },

  update: (logID, data, callback) => {
    const { pressure_value, temperature_value } = data;
    db.query(
      'UPDATE LogData SET pressure_value = ?, temperature_value = ? WHERE logID = ?',
      [pressure_value, temperature_value, logID],
      callback
    );
  },

  delete: (logID, callback) => {
    db.query('DELETE FROM LogData WHERE logID = ?', [logID], callback);
  }
};



module.exports = LogData;