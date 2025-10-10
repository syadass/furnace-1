// components/admin/sidebar.jsx
import { useState } from "react";
import {
  FaTachometerAlt,
  FaUserCog,
  FaUserPlus,
  FaList,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom"; 

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // 🚨 GRADIENT COLORS
  // Warna Awal (Lebih Gelap)
  const startColor = "#2c5a95"; // Biru gelap
  // Warna Akhir (Lebih Terang/Sedang)
  const endColor = "#3674B5"; // Biru utama (seperti permintaan Anda)
  
  // Warna untuk item yang aktif dan hover
  const hoverColor = "hover:bg-[#2770d9]"; // Biru sedikit lebih terang
  const activeColor = "bg-[#2770d9]"; // Biru terang untuk item yang aktif
  const subMenuBg = "bg-[#1f4773]"; // Background sub-menu yang lebih gelap dari startColor

  const isActive = (path) => location.pathname === path;
  
  // Cek apakah Manajamen Operator aktif (salah satu sub-menu aktif)
  const isManajemenOperatorActive = 
      location.pathname.startsWith("/admin/tambah-operator") || 
      location.pathname.startsWith("/admin/data-operator");
  
  // State dropdown
  const [openMenu, setOpenMenu] = useState(isManajemenOperatorActive); 

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    // 🚨 IMPLEMENTASI GRADIENT DENGAN INLINE STYLE dan Tailwind class
    <aside 
        className={`w-64 text-white flex flex-col min-h-screen fixed top-[60px] left-0 z-10 shadow-xl`}
        style={{
            backgroundImage: `linear-gradient(to bottom, ${startColor}, ${endColor})` // Gradasi Vertikal
        }}
    >

      {/* Menu Navigasi Utama */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-base ${hoverColor} ${
                isActive("/admin/dashboard") ? activeColor : "" 
              }`}
            >
              <FaTachometerAlt className="text-xl" /> Dashboard
            </Link>
          </li>

          {/* Dropdown Manajemen Operator */}
          <li className="mt-2">
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors text-base ${hoverColor} ${
                isManajemenOperatorActive ? activeColor : "" 
              }`}
            >
              <span className="flex items-center gap-3">
                <FaUserCog className="text-xl" /> Manajemen Operator
              </span>
              {openMenu ? <FaChevronDown className="text-sm" /> : <FaChevronRight className="text-sm" />}
            </button>

            {/* Submenu Dropdown */}
            {openMenu && (
              // Submenu menggunakan subMenuBg baru yang lebih gelap dari gradasi
              <ul className={`ml-3 mt-1 space-y-1 ${subMenuBg} rounded-b-lg p-1`}> 
                <li>
                  <Link
                    to="/admin/tambah-operator"
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[#2770d9] ${
                      isActive("/admin/tambah-operator") ? activeColor : ""
                    }`}
                  >
                    <FaUserPlus /> Tambah Operator
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/data-operator"
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[#2770d9] ${
                      isActive("/admin/data-operator") ? activeColor : ""
                    }`}
                  >
                    <FaList /> Daftar Operator
                  </Link>
                </li>
              </ul>
            )}
          </li>
          
          {/* Tombol Logout */}
          <li className="pt-4 border-t border-white border-opacity-30 mt-4"> 
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 text-base bg-red-600 hover:bg-red-700 rounded-lg w-full text-left transition-colors shadow-lg"
            >
              <FaSignOutAlt className="text-xl" /> Logout
            </button>
          </li>
        </ul>
      </nav>
      
    </aside>
  );
};

export default Sidebar;