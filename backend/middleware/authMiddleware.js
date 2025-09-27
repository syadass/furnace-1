const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Ambil token dari header
  const token = req.header('x-auth-token');

  // Cek jika tidak ada token
  if (!token) {
    return res.status(401).json({ msg: 'Tidak ada token, otorisasi ditolak' });
  }

  // Verifikasi token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // payload dari token (misal: { id: 13, name: 'User A' })
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token tidak valid' });
  }
};