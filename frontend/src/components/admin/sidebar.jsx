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
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false); // state dropdown

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-[#3674B5] text-white flex flex-col min-h-[calc(100vh-80px)]">
      {/* Logo dan Fakultas di bagian atas sidebar */}
      <div className="p-4 flex items-center gap-3 bg-white border-b">
        <img src="/assets/logo.jpg" alt="Logo" className="w-10 h-10" />
        <span className="text-sm font-bold leading-tight text-[#3674B5]">
          Fakultas Sains dan Teknologi
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 p-2 hover:bg-[#2c5a95] rounded"
            >
              <FaTachometerAlt /> Dashboard
            </Link>
          </li>

          {/* Dropdown Manajemen Operator */}
          <li>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="flex items-center justify-between w-full p-2 hover:bg-[#2c5a95] rounded"
            >
              <span className="flex items-center gap-2">
                <FaUserCog /> Manajemen Operator
              </span>
              {openMenu ? <FaChevronDown /> : <FaChevronRight />}
            </button>

            {openMenu && (
              <ul className="ml-6 mt-1 space-y-1">
                <li>
                  <Link
                    to="/admin/tambah-operator"
                    className="flex items-center gap-2 p-2 hover:bg-[#2c5a95] rounded"
                  >
                    <FaUserPlus /> Tambah Operator
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/data-operator"
                    className="flex items-center gap-2 p-2 hover:bg-[#2c5a95] rounded"
                  >
                    <FaList /> Daftar Operator
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 hover:bg-red-600 rounded w-full text-left mt-4"
            >
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;