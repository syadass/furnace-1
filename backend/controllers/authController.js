const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authController = {
  login: (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/Email dan password wajib diisi' });
    }

    User.findByUsernameOrEmail(identifier, (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) return res.status(400).json({ message: 'User tidak ditemukan' });

      const user = results[0];
      if (password !== user.password) {
        return res.status(400).json({ message: 'Password salah' });
      }

      // Cek role
      if (!['admin', 'operator', 'viewer'].includes(user.role)) {
        return res.status(403).json({ message: 'Role tidak valid' });
      }

      const token = jwt.sign(
        { id: user.userID, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Login berhasil',
        token,
        role: user.role,
        username: user.username
      });
    });
  }
};

module.exports = authController;
