const express = require("express");
const router = express.Router();
const db = require("../config/db");
const User = require("../models/userModel");

// ✅ GET semua user
router.get("/", (req, res) => {
  db.query(
    "SELECT userID, username, password, nama_lengkap, NIM, email, role, created_at FROM users",
    (err, results) => {
      if (err) {
        console.error("❌ Error SELECT:", err);
        return res.status(500).json({ message: err.message });
      }
      res.json(results);
    }
  );
});

// ✅ POST tambah user
router.post("/", (req, res) => {
  console.log("📩 Data diterima dari React:", req.body);

  const { username, password, nama_lengkap, NIM, email, role } = req.body;

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: "Username, password, dan email wajib diisi" });
  }

  const newUser = {
    username,
    password,
    nama_lengkap,
    NIM: NIM || null,
    email,
    role: role || "operator",
  };

  const sql = `
    INSERT INTO users 
      (username, password, nama_lengkap, NIM, email, role, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    sql,
    [
      newUser.username,
      newUser.password,
      newUser.nama_lengkap,
      newUser.NIM,
      newUser.email,
      newUser.role,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Error INSERT:", err);
        return res
          .status(500)
          .json({ message: "Gagal menambahkan user", error: err });
      }

      res.status(201).json({
        message: "User berhasil ditambahkan",
        userID: result.insertId,
        ...newUser,
      });
    }
  );
});

// ✅ DELETE user
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Hapus userID:", id);

  db.query("DELETE FROM users WHERE userID = ?", [id], (err, result) => {
    if (err) {
      console.error("❌ Error DELETE:", err);
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil dihapus" });
  });
});

// ✅ UPDATE user
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nama_lengkap, email, username, NIM, role } = req.body;

  console.log("✏️ Update userID:", id, "Data:", req.body);

  const sql = `
    UPDATE users 
    SET nama_lengkap=?, email=?, username=?, NIM=?, role=? 
    WHERE userID=?
  `;

  db.query(sql, [nama_lengkap, email, username, NIM, role, id], (err, result) => {
    if (err) {
      console.error("❌ Error UPDATE:", err);
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil diupdate" });
  });
});

// ✅ GET user by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT userID, username, password, nama_lengkap, NIM, email, role, created_at
    FROM users
    WHERE userID = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error SELECT by ID:", err);
      return res.status(500).json({ message: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json(result[0]); // ambil object pertama
  });
});

module.exports = router;
