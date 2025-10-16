const db = require('../config/db');

const LogData = {

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
        db.query(query.trim(), [userID], callback);
    },
    
    // ✨ BARU & DIPERBAIKI: Mengambil sesi berdasarkan furnace dan tanggal
    getSessionsByDateAndFurnace: (userID, furnace_id, date, callback) => {
        // Query ditulis satu baris agar tidak ada error spasi/enter
        const query = 'SELECT session_id, startTime, endTime FROM session_history WHERE userID = ? AND furnace_id = ? AND DATE(startTime) = ? ORDER BY startTime ASC';
        db.query(query, [userID, furnace_id, date], callback);
    },

    // ✨ BARU & DIPERBAIKI: Mengambil log untuk grafik berdasarkan session_id
    getLogsBySession: (session_id, callback) => {
        // Query ditulis satu baris agar tidak ada error spasi/enter
        const query = 'SELECT l.timestamp, l.temperature_value, l.pressure_value FROM logdata l JOIN session_history s ON l.furnace_id = s.furnace_id AND l.userID = s.userID WHERE s.session_id = ? AND l.timestamp BETWEEN s.startTime AND IFNULL(s.endTime, NOW()) ORDER BY l.timestamp ASC';
        db.query(query, [session_id], callback);
    },
    
    // ✨ BARU & DIPERBAIKI: Mengambil log untuk CSV berdasarkan session_id dengan detail
    getLogsBySessionWithDetails: (session_id, callback) => {
        // Query ditulis satu baris agar tidak ada error spasi/enter
        const query = 'SELECT l.*, u.nama_lengkap FROM logdata l JOIN users u ON l.userID = u.userID JOIN session_history s ON l.furnace_id = s.furnace_id AND l.userID = s.userID WHERE s.session_id = ? AND l.timestamp BETWEEN s.startTime AND IFNULL(s.endTime, NOW()) ORDER BY l.timestamp ASC';
        db.query(query, [session_id], callback);
    },

    getByUser: (userID, callback) => {
        db.query('SELECT * FROM logdata WHERE userID = ?', [userID], callback);
    },
    
    getAll: (callback) => {
        const query = `
            SELECT 
                l.*, 
                u.nama_lengkap 
            FROM logdata l
            JOIN users u ON l.userID = u.userID
            ORDER BY l.timestamp DESC
        `;
        db.query(query.trim(), callback);
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
        db.query(query.trim(), [userID, furnace_id, date], callback);
    },

    create: (data, callback) => {
        const { userID, pressure_value, temperature_value, furnace_id } = data; 
        const sql = 'INSERT INTO logdata (userID, pressure_value, temperature_value, furnace_id) VALUES (?, ?, ?, ?)';
        db.query(sql, [userID, pressure_value, temperature_value, furnace_id], callback);
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
        const query = `
            DELETE FROM logdata
            WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        db.query(query.trim(), [days], callback);
    }
};

module.exports = LogData;