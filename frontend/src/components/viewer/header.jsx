import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
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
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 text-white font-semibold shadow-md hover:bg-white/20 hover:scale-105 transition-all duration-300 transform"
      >
        <LogOut size={20} />
      </button>
    </header>
  );
};

export default Header;
