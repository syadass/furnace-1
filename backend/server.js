const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const setpointRoutes = require("./routes/setpointRoutes");
const logRoutes = require('./routes/logRoutes');
const furnaceRoutes = require('./routes/furnaceRoutes'); 
const mqttService = require('./services/mqttService');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server capstone berjalan...');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/setpoints", setpointRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/furnaces', furnaceRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  mqttService.connectAndSubscribe(); 
});