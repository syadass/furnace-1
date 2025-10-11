// logcontroller.js

const { Parser } = require('json2csv');
const LogData = require('../models/logModel');

// GET semua log
exports.getAllLogs = (req, res) => {
  LogData.getAll((err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
};

// GET log by user
exports.getLogsByUser = (req, res) => {
  const { userID } = req.params;
  // Memanggil fungsi baru yang mengambil nama_lengkap
  LogData.getByUserWithDetails(userID, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
};

// POST buat log baru
exports.createLog = (req, res) => {
  const { userID, pressure_value, temperature_value, furnace_id } = req.body;
  LogData.create({ userID, pressure_value, temperature_value, furnace_id }, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: 'Log created', logID: result.insertId });
  });
};

// PUT update log
exports.updateLog = (req, res) => {
  const { logID } = req.params;
  const { pressure_value, temperature_value } = req.body;
  LogData.update(logID, { pressure_value, temperature_value }, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Log updated' });
  });
};

// DELETE hapus log
exports.deleteLog = (req, res) => {
  const { logID } = req.params;
  LogData.delete(logID, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Log deleted' });
  });
};

// Fungsi download CSV per hari
exports.downloadCSVByDate = (req, res) => {
  const { furnace_id, date } = req.params;
  const userID = req.user.id; 

  // Menggunakan model yang baru untuk memastikan nama_lengkap ikut terambil
  LogData.getLogsByUserAndFurnaceForDateWithDetails(userID, furnace_id, date, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!results.length) return res.status(404).json({ message: "No data found for this furnace on the specified date" });

    // *** PENAMBAHAN 'nama_lengkap' DI SINI ***
    const fields = ['logID', 'userID', 'nama_lengkap', 'furnace_id', 'pressure_value', 'temperature_value', 'timestamp'];
    const parser = new Parser({ fields });
    const csv = parser.parse(results);

    // Nama file sekarang menyertakan tanggal
    const fileName = `log_user_${userID}_${furnace_id}_${date}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  });
};

// ==========================================================
// == PENAMBAHAN FUNGSI BARU: CLEANUP LOGS LAMA SECARA MANUAL ==
// ==========================================================
exports.manuallyCleanLogs = (req, res) => {
  // Batas 1 hari
  const daysToKeep = 1; 
    
  LogData.cleanOldLogs(daysToKeep, (err, result) => {
    if (err) {
      console.error('Error saat membersihkan log lama:', err);
      return res.status(500).json({ message: 'Gagal membersihkan log lama.' });
    }
    res.json({ 
      message: `Berhasil membersihkan log yang lebih tua dari ${daysToKeep} hari.`,
      deletedRows: result.affectedRows
    });
  });
};