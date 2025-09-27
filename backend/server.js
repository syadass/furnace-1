// 1. Kumpulkan semua 'require' di bagian atas
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const setpointRoutes = require("./routes/setpointRoutes");
const logRoutes = require('./routes/logRoutes');
const furnaceRoutes = require('./routes/furnaceRoutes'); // Import furnace routes
const mqttService = require('./services/mqttService');

// 2. Konfigurasi environment variables
dotenv.config();

// 3. Inisialisasi aplikasi Express
const app = express();

// 4. Gunakan middleware
app.use(cors());
app.use(express.json());

// 5. Daftarkan semua rute API
app.get('/', (req, res) => {
  res.send('Server capstone berjalan...');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/setpoints", setpointRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/furnaces', furnaceRoutes); // Daftarkan furnace routes

// 6. Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  mqttService.connectAndSubscribe(); // Jalankan MQTT service setelah server siap
});