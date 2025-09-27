import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock } from "react-icons/fa";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifier,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", res.data.username);

      if (res.data.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (res.data.role === "operator") {
        navigate("/operator/dashboard", { replace: true });
      } else {
        navigate("/viewer/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/assets/bg.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      {/* Card Login */}
      <div className="bg-white p-10 rounded-2xl shadow-xl w-[380px] text-center">
        {/* Logo */}
        <img
          src="/assets/logo.jpg"
          alt="Logo"
          className="w-24 h-24 mx-auto mb-4"
        />
        {/* Title */}
        <h2
          className="text-xl font-bold mb-6 leading-snug"
          style={{ color: "#3674B5" }}
        >
          Fakultas Sains dan Teknologi <br /> Universitas Jambi
        </h2>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaUser className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Username atau Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="flex-1 outline-none"
            />
          </div>

          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaLock className="text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="flex-1 outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: "#3674B5" }}
            className="w-full text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            {isLoading ? "Loading..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
