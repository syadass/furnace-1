const db = require('../config/db');
const { getClient } = require('../services/mqttService');

exports.getFurnaceStatus = (req, res) => {
  const query = `
    SELECT 
      fs.*, 
      u.nama_lengkap AS active_user_fullname
    FROM furnace_status fs
    LEFT JOIN users u ON fs.active_userID = u.userID
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
};

exports.startSession = (req, res) => {
  console.log("Mencoba memulai sesi. User dari token:", req.user);

  const { furnace_id } = req.body;
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Otentikasi gagal, user tidak ditemukan." });
  }

  const userID = req.user.id;
  const mqttClient = getClient();

  const checkQuery = 'SELECT * FROM furnace_status WHERE furnace_id = ? AND is_active = TRUE';
  db.query(checkQuery, [furnace_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Furnace sedang digunakan oleh user lain.' });
    }

    db.beginTransaction(err => {
      if (err) {
        return res.status(500).json({ message: "Gagal memulai transaksi database." });
      }

      const sessionQuery = 'INSERT INTO session_history (furnace_id, userID, startTime) VALUES (?, ?, NOW())';
      db.query(sessionQuery, [furnace_id, userID], (err, sessionResult) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ message: "Gagal mencatat histori sesi." });
          });
        }

        const updateQuery = `
          UPDATE furnace_status 
          SET is_active = TRUE, active_userID = ?, session_startTime = NOW() 
          WHERE furnace_id = ?
        `;
        db.query(updateQuery, [userID, furnace_id], (err, result) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ message: "Gagal mengupdate status furnace." });
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ message: "Gagal menyimpan perubahan." });
              });
            }

            console.log(`🚀 Mengirim perintah MULAI SESI ke ${furnace_id}`);
            const setpointTopic = `setpoint/furnace/${furnace_id}`;
            const controlTopic = `control/furnace/${furnace_id}`;

            mqttClient.publish(setpointTopic, JSON.stringify({ suhu: 70 }), { qos: 1 });
            mqttClient.publish(controlTopic, JSON.stringify({ mode: "auto" }), { qos: 1 });

            res.json({ message: `Sesi untuk ${furnace_id} berhasil dimulai.` });
          });
        });
      });
    });
  });
};

exports.endSession = (req, res) => {
  console.log("Mencoba mengakhiri sesi. User dari token:", req.user);

  const { furnace_id } = req.body;
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Otentikasi gagal, user tidak ditemukan." });
  }

  const userID = req.user.id;
  const mqttClient = getClient();

  const checkQuery = 'SELECT * FROM furnace_status WHERE furnace_id = ? AND active_userID = ?';
  db.query(checkQuery, [furnace_id, userID], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) {
      return res.status(403).json({ message: 'Anda tidak berhak mengakhiri sesi ini.' });
    }

    db.beginTransaction(err => {
      if (err) {
        return res.status(500).json({ message: "Gagal memulai transaksi database." });
      }

      const sessionQuery = 'UPDATE session_history SET endTime = NOW() WHERE furnace_id = ? AND userID = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1';
      db.query(sessionQuery, [furnace_id, userID], (err, sessionResult) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ message: "Gagal memperbarui histori sesi." });
          });
        }
        
        const updateQuery = `
          UPDATE furnace_status 
          SET is_active = FALSE, active_userID = NULL, session_startTime = NULL 
          WHERE furnace_id = ?
        `;
        db.query(updateQuery, [furnace_id], (err, result) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ message: "Gagal mengupdate status furnace." });
            });
          }

          db.commit(err => {
            if (err) {
               return db.rollback(() => {
                  res.status(500).json({ message: "Gagal menyimpan perubahan." });
                });
            }

            console.log(`🚀 Mengirim perintah AKHIRI SESI ke ${furnace_id}`);
            const controlTopic = `control/furnace/${furnace_id}`;
            const payload = JSON.stringify({
              mode: "manual",
              power: "off"
            });
            mqttClient.publish(controlTopic, payload, { qos: 1 });

            res.json({ message: `Sesi untuk ${furnace_id} telah berakhir.` });
          });
        });
      });
    });
  });
};

// --- ✨ FUNGSI BARU DITAMBAHKAN DI SINI ---
exports.getAllAccessLogs = (req, res) => {
  // Menggunakan LEFT JOIN agar data sesi tetap tampil
  // walaupun data user-nya (misal ID 100) tidak ada di tabel 'users'.
  const query = `
    SELECT 
        sh.session_id, 
        sh.furnace_id, 
        sh.startTime AS waktu_mulai, 
        sh.endTime AS waktu_selesai, 
        u.nama_lengkap AS nama_operator
    FROM session_history sh
    LEFT JOIN users u ON sh.userID = u.userID
    ORDER BY sh.startTime DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching access logs:", err);
      return res.status(500).json({ message: "Gagal mengambil data riwayat akses." });
    }
    // Kirim data yang sudah di-join ke frontend
    res.json(results);
  });
};