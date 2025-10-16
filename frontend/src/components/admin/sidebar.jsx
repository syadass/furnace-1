// src/components/admin/Sidebar.jsx

import { useState } from "react"; // 1. Import useState
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
// 2. Import komponen modal (pastikan path ini benar)
import LogoutConfirmationModal from "../LogoutConfirmationModal";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const startColor = "#2c5a95";
  const endColor = "#3674B5";
  const hoverColor = "hover:bg-[#2770d9]";
  const activeColor = "bg-[#2770d9]";
  const subMenuBg = "bg-[#1f4773]";

  const isActive = (path) => location.pathname === path;

  const isManajemenOperatorActive =
    location.pathname.startsWith("/admin/tambah-operator") ||
    location.pathname.startsWith("/admin/data-operator");

  const [openMenu, setOpenMenu] = useState(isManajemenOperatorActive);
  
  // 3. Tambahkan state untuk mengontrol visibilitas modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4. Ganti nama fungsi ini menjadi handleLogoutConfirm
  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsModalOpen(false); // Tutup modal setelah logout
    navigate("/login");
  };

  return (
    // 5. Gunakan React Fragment agar bisa merender Sidebar dan Modal
    <>
      <aside
        className={`w-64 text-white flex flex-col min-h-screen fixed top-[60px] left-0 z-10 shadow-xl`}
        style={{
          backgroundImage: `linear-gradient(to bottom, ${startColor}, ${endColor})`,
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
                onClick={() => setIsModalOpen(true)} // 6. Ubah onClick untuk membuka modal
                className="flex items-center gap-3 p-3 text-base bg-red-600 hover:bg-red-700 rounded-lg w-full text-left transition-colors shadow-lg"
              >
                <FaSignOutAlt className="text-xl" /> Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 7. Render komponen modal di sini */}
      <LogoutConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default Sidebar;