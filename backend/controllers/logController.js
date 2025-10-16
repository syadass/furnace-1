const { Parser } = require('json2csv');
const LogData = require('../models/logModel');


exports.getAllLogs = (req, res) => {
    LogData.getAll((err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};


exports.getLogsByUser = (req, res) => {
    const { userID } = req.params;
    LogData.getByUserWithDetails(userID, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};


exports.createLog = (req, res) => {
    const { userID, pressure_value, temperature_value, furnace_id } = req.body;
    LogData.create({ userID, pressure_value, temperature_value, furnace_id }, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: 'Log created', logID: result.insertId });
    });
};


exports.updateLog = (req, res) => {
    const { logID } = req.params;
    const { pressure_value, temperature_value } = req.body;
    LogData.update(logID, { pressure_value, temperature_value }, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Log updated' });
    });
};


exports.deleteLog = (req, res) => {
    const { logID } = req.params;
    LogData.delete(logID, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Log deleted' });
    });
};

// ✨ BARU: Fungsi untuk mengambil daftar sesi
exports.getSessionsByDateAndFurnace = (req, res) => {
    const { furnace_id, date } = req.params;
    const userID = req.user.id;

    LogData.getSessionsByDateAndFurnace(userID, furnace_id, date, (err, results) => {
        if (err) {
            console.error("Error fetching session list:", err);
            return res.status(500).json({ message: err.message });
        }
        res.json(results);
    });
};

// ✨ DIPERBARUI: Fungsi untuk mengambil data JSON untuk grafik berdasarkan SESI
exports.getChartDataBySession = (req, res) => {
    const { session_id } = req.params;

    LogData.getLogsBySession(session_id, (err, results) => {
        if (err) {
            console.error("Error fetching chart data by session:", err);
            return res.status(500).json({ message: err.message });
        }

        const chartData = results.map(log => ({
            timestamp: log.timestamp,
            suhu: log.temperature_value,
            tekanan: log.pressure_value,
        }));

        res.json(chartData);
    });
};

// ✨ DIPERBARUI: fungsi download csv berdasarkan SESI
exports.downloadCSVBySession = (req, res) => {
    const { session_id } = req.params;

    LogData.getLogsBySessionWithDetails(session_id, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!results.length) return res.status(404).json({ message: "No data found for this session" });

        const fields = [
            { label: 'Nama Operator', value: 'nama_lengkap' },
            { label: 'Nama Furnace', value: 'furnace_id' },
            { label: 'Tekanan (bar)', value: 'pressure_value' },
            { label: 'Suhu (°C)', value: 'temperature_value' },
            { label: 'Waktu Pencatatan', value: 'timestamp' }
        ];

        const formattedData = results.map(row => ({
            ...row,
            timestamp: new Date(row.timestamp).toLocaleString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\./g, ':')
        }));

        const parser = new Parser({ fields, delimiter: ';' });
        const csv = parser.parse(formattedData);

        // Mengambil detail untuk nama file
        const firstRow = results[0];
        const date = new Date(firstRow.timestamp).toISOString().split('T')[0];
        const fileName = `log_sesi_${session_id}_${firstRow.furnace_id}_${date}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(csv);
    });
};



// Fungsi Cleanup Logs
exports.manuallyCleanLogs = (req, res) => {
    const daysToKeep = 30; 
    
    LogData.cleanOldLogs(daysToKeep, (err, result) => {
        if (err) {
            console.error('Error saat membersihkan log lama:', err);
            return res.status(500).json({ message: 'Gagal membersihkan log lama.' });
        }
        res.json({ 
            message: `Berhasil membersihkan log yang lebih tua dari ${daysToKeep} hari (sekitar 1 bulan).`,
            deletedRows: result.affectedRows
        });
    });
};