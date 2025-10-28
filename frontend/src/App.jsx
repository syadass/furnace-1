import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/Dashboard';
import OperatorDashboard from './pages/operator/Dashboard';
import ViewerDashboard from './pages/viewer/Dashboard';
import TambahOperator from './pages/admin/tambahOperator';
import DataOperator from './pages/admin/dataOperator';
import FormTambah from './pages/admin/formTambah';
import LihatDataOperator from './pages/admin/lihatDataOperator';
import FormEdit from "./pages/admin/formEdit";
import LogMonitoring from "./pages/operator/logMonitoring";

// --- 1. TAMBAHKAN IMPORT UNTUK HALAMAN BARU ---
// (Pastikan nama file 'RiwayatAkses' ini sesuai dengan yang Anda buat)
import RiwayatAkses from './pages/admin/riwayatAkses'; 
// ---------------------------------------------

import { MqttProvider } from './services/mqttContext'; 

const MqttLayout = () => (
  <MqttProvider>
    <Outlet /> 
  </MqttProvider>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* --- RUTE PUBLIK (DI LUAR MQTT) --- */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* --- RUTE TERLINDUNGI (DI DALAM MQTT) --- */}
        <Route element={<MqttLayout />}>
          {/* ... rute-rute Anda yang sudah ada ... */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/operator/dashboard" element={<OperatorDashboard />} />
          <Route path="/viewer/dashboard" element={<ViewerDashboard />} />
          <Route path="/admin/tambah-operator" element={<TambahOperator />} />
          <Route path="/admin/data-operator" element={<DataOperator />} />
          <Route path="/admin/form-tambah" element={<FormTambah />} />
          <Route path="/admin/form-edit/:id" element={<FormEdit />} />
          <Route path="/admin/lihat-data-operator" element={<LihatDataOperator />} />
          <Route path="/log-monitoring" element={<LogMonitoring />} />

          {/* --- 2. TAMBAHKAN RUTE BARU DI SINI --- */}
          <Route path="/admin/riwayat-akses" element={<RiwayatAkses />} />
          {/* -------------------------------------- */}

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
