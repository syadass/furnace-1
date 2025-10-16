// src/components/operator/header.jsx

import { useState } from "react"; // 1. Import useState
import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard, Activity } from "lucide-react";
import LogoutConfirmationModal from "../LogoutConfirmationModal"; // 2. Import komponen modal

const Header = () => {
  const navigate = useNavigate();
  
  // 3. Tambahkan state untuk mengontrol visibilitas modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fungsi logout yang sebenarnya, akan dipanggil saat dikonfirmasi
  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsModalOpen(false); // Tutup modal setelah logout
    navigate("/login");
  };

  return (
    // Gunakan React Fragment (<>) untuk membungkus header dan modal
    <>
      <header className="bg-gradient-to-r from-[#3674B5] to-[#1C4E8C] shadow-xl px-6 py-3 flex items-center justify-between backdrop-blur-md rounded-b-lg">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img
            src="/assets/logo.jpg"
            alt="Logo"
            className="w-12 h-12 rounded-full border-2 border-white shadow-md"
          />
        </div>

        {/* Navigation */}
        <nav className="flex space-x-6 text-white font-medium">
          <NavLink
            to="/operator/dashboard"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 transform ${
                isActive
                  ? "bg-white/30 backdrop-blur-sm text-white shadow-md scale-105"
                  : "hover:bg-white/20 hover:scale-105"
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className="font-semibold">Dashboard</span>
          </NavLink>

          <NavLink
            to="/log-monitoring" // Pastikan route ini ada di router Anda
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 transform ${
                isActive
                  ? "bg-white/30 backdrop-blur-sm text-white shadow-md scale-105"
                  : "hover:bg-white/20 hover:scale-105"
              }`
            }
          >
            <Activity size={20} />
            <span className="font-semibold">Log Monitoring</span>
          </NavLink>
        </nav>

        {/* Tombol Logout */}
        <button
          onClick={() => setIsModalOpen(true)} // 4. Ubah onClick untuk membuka modal
          className="flex items-center space-x-2 text-white font-semibold shadow-md p-2 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 transform"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* 5. Render komponen modal di sini */}
      <LogoutConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Prop untuk menutup modal
        onConfirm={handleLogoutConfirm}      // Prop untuk menjalankan logout
      />
    </>
  );
};

export default Header;