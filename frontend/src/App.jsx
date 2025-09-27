import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect "/" ke "/login" */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Role-based Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/operator/dashboard" element={<OperatorDashboard />} />
        <Route path="/viewer/dashboard" element={<ViewerDashboard />} />

        {/* Admin Routes */}
        <Route path="/admin/tambah-operator" element={<TambahOperator />} />
        <Route path="/admin/data-operator" element={<DataOperator />} />
        <Route path="/admin/form-tambah" element={<FormTambah />} />
        <Route path="/admin/form-edit/:id" element={<FormEdit />} />
        <Route path="/admin/lihat-data-operator" element={<LihatDataOperator />} />

        {/* Operator Routes */}
        <Route path="/log-monitoring" element={<LogMonitoring />} />

      </Routes>
    </Router>
  );
}

export default App;


