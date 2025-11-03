// src/components/admin/Sidebar.jsx

import { useState, useEffect } from "react"; // <-- Tambahkan useEffect
import {
  FaTachometerAlt,
  FaUserCog,
  FaUserPlus,
  FaList,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaHistory,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
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

  // --- ✨ PERBARUI KONDISI INI --- ✨
  // Sekarang cek apakah path dimulai dengan salah satu dari tiga opsi ini
  const isManajemenOperatorActive =
    location.pathname.startsWith("/admin/tambah-operator") ||
    location.pathname.startsWith("/admin/data-operator") ||
    location.pathname.startsWith("/admin/riwayat-akses"); // <-- Tambahkan ini

  // Gunakan state untuk membuka menu, inisialisasi berdasarkan kondisi aktif
  const [openMenu, setOpenMenu] = useState(isManajemenOperatorActive);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- ✨ TAMBAHAN: Sinkronkan state openMenu jika URL berubah --- ✨
  useEffect(() => {
    // Jika salah satu submenu aktif saat URL berubah, buka dropdown-nya
    if (isManajemenOperatorActive) {
      setOpenMenu(true);
    }
    // Opsional: Jika Anda ingin menutup dropdown saat navigasi ke menu lain, tambahkan else:
    // else {
    //   setOpenMenu(false);
    // }
  }, [location.pathname, isManajemenOperatorActive]); // Jalankan efek saat path berubah

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // Hapus user juga jika disimpan
    setIsModalOpen(false);
    navigate("/login");
  };

  return (
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
                  // Tetap gunakan isManajemenOperatorActive untuk highlight tombol utama
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
                  {/* Tambah Operator */}
                  <li>
                    <Link
                      to="/admin/tambah-operator"
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[#2770d9] ${
                        // Gunakan isActive untuk highlight submenu spesifik
                        isActive("/admin/tambah-operator") ? activeColor : ""
                      }`}
                    >
                      <FaUserPlus /> Tambah Operator
                    </Link>
                  </li>
                  {/* Daftar Operator */}
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

                  {/* --- ✨ PINDAHKAN RIWAYAT AKSES KE SINI --- ✨ */}
                  <li>
                    <Link
                      to="/admin/riwayat-akses"
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[#2770d9] ${
                        isActive("/admin/riwayat-akses") ? activeColor : ""
                      }`}
                    >
                      <FaHistory /> Riwayat Akses
                    </Link>
                  </li>
                  {/* --- ✨ AKHIR PEMINDAHAN --- ✨ */}

                </ul>
              )}
            </li>

            {/* --- HAPUS BAGIAN INI ---
            <li className="mt-2">
              <Link
                to="/admin/riwayat-akses"
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-base ${hoverColor} ${
                  isActive("/admin/riwayat-akses") ? activeColor : ""
                }`}
              >
                <FaHistory className="text-xl" /> Riwayat Akses
              </Link>
            </li>
            */}

            {/* Tombol Logout */}
            <li className="pt-4 border-t border-white border-opacity-30 mt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 p-3 text-base bg-red-600 hover:bg-red-700 rounded-lg w-full text-left transition-colors shadow-lg"
              >
                <FaSignOutAlt className="text-xl" /> Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Modal Logout */}
      <LogoutConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default Sidebar;