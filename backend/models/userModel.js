const db = require('../config/db');

const User = {
  create: (userData, callback) => {
    const query = `
      INSERT INTO users (username, password, nama_lengkap, NIM, email, role, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(query, [
      userData.username, 
      userData.password, 
      userData.nama_lengkap || null, 
      userData.NIM || null,
      userData.email, 
      userData.role || 'operator'
    ], callback);
  },

  findByUsernameOrEmail: (identifier, callback) => {
    const query = 'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1';
    db.query(query, [identifier, identifier], callback);
  },
};

module.exports = User;
