// logmodels.js

const db = require('../config/db');

const LogData = {
    // ... fungsi-fungsi yang sudah ada (tidak berubah)

    // FUNGSI BARU: Mendapatkan Log berdasarkan User ID DENGAN nama_lengkap
    getByUserWithDetails: (userID, callback) => {
        const query = `
            SELECT 
                l.*, 
                u.nama_lengkap 
            FROM logdata l
            JOIN users u ON l.userID = u.userID
            WHERE l.userID = ?
            ORDER BY l.timestamp DESC
        `;
        db.query(query, [userID], callback);
    },
    
    // FUNGSI BARU: Mengambil Log untuk Download CSV DENGAN nama_lengkap
    getLogsByUserAndFurnaceForDateWithDetails: (userID, furnace_id, date, callback) => {
        const query = `
            SELECT 
                l.*, 
                u.nama_lengkap 
            FROM logdata l
            JOIN users u ON l.userID = u.userID
            WHERE l.userID = ? AND l.furnace_id = ? AND DATE(l.timestamp) = ? 
            ORDER BY l.timestamp ASC
        `;
        db.query(query, [userID, furnace_id, date], callback);
    },

    // FUNGSI LAMA getByUser (direkomendasikan untuk diganti/diarahkan ke getByUserWithDetails jika selalu butuh nama_lengkap)
    getByUser: (userID, callback) => {
        db.query('SELECT * FROM logdata WHERE userID = ?', [userID], callback);
    },
    
    // ... fungsi-fungsi lainnya
    getAll: (callback) => {
        // Direkomendasikan untuk menambahkan JOIN di sini juga jika ingin nama_lengkap di getAllLogs
        const query = `
            SELECT 
                l.*, 
                u.nama_lengkap 
            FROM logdata l
            JOIN users u ON l.userID = u.userID
            ORDER BY l.timestamp DESC
        `;
        db.query(query, callback);
    },

    getLogsByUserAndFurnace: (userID, furnace_id, callback) => {
        // Direkomendasikan untuk menambahkan JOIN di sini juga jika ingin nama_lengkap
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
        const { userID, pressure_value, temperature_value, furnace_id } = data; 
        const sql = 'INSERT INTO logdata (userID, pressure_value, temperature_value, furnace_id) VALUES (?, ?, ?, ?)';
        
        db.query(
            sql,
            [userID, pressure_value, temperature_value, furnace_id],
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
    },
    
    cleanOldLogs: (days, callback) => {
        // Query untuk menghapus data di mana timestamp lebih tua dari hari ini minus N hari
        const query = `
            DELETE FROM logdata
            WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        db.query(query, [days], callback);
    }
};

module.exports = LogData;