import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react"; // hanya Dashboard & Logout

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
        <span className="text-white font-bold text-lg">Universitas Jambi</span>
      </div>

      {/* Navigation */}
      <nav className="flex space-x-6 text-white font-medium">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-2 rounded-md transition ${
              isActive ? "bg-blue-500" : "hover:bg-[#285a8a]"
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
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
