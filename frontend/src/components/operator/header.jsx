import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard, Activity } from "lucide-react"; // icon

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="bg-[#3674B5] shadow-md px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <img
          src="/assets/logo.jpg"
          alt="Logo"
          className="w-10 h-10 rounded-full"
        />
      </div>

      {/* Navigation */}
      <nav className="flex space-x-6 text-white font-medium">
        <NavLink
          to="/operator/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-2 rounded-md transition ${
              isActive ? "bg-white/50" : "hover:bg-[#285a8a]"
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/log-monitoring"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-2 rounded-md transition ${
              isActive ? "bg-white/50" : "hover:bg-[#285a8a]"
            }`
          }
        >
          <Activity size={18} />
          <span>Log Monitoring</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 bg-red-500 px-4 py-2 rounded-md text-white font-semibold hover:bg-red-600 transition"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </header>
  );
};

export default Header;
