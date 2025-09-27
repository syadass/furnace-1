import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";
import axios from "axios";

export default function FormEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    username: "",
    nim: "",
    email: "",
    password: "",
    role: "operator",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Ambil data user
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/users/${id}`)
      .then((res) => {
        setFormData({
          nama_lengkap: res.data.nama_lengkap,
          username: res.data.username,
          nim: res.data.NIM,
          email: res.data.email,
          password: "",
          role: res.data.role || "operator",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMessage("❌ Gagal mengambil data user!");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await axios.put(`http://localhost:5000/api/users/${id}`, {
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        NIM: formData.nim,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setMessage("✅ Data berhasil diperbarui!");
      setTimeout(() => navigate("/admin/dashboard"), 1000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Gagal memperbarui data user!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-blue-100">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#3674B5" }}>Edit User</h2>
          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.startsWith("✅")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6"
          >
            {/* Nama Lengkap */}
            <div>
              <label className="block mb-2 font-medium">Nama Lengkap:</label>
              <input
                type="text"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block mb-2 font-medium">Username:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                required
              />
            </div>

            {/* NIM */}
            <div>
              <label className="block mb-2 font-medium">NIM:</label>
              <input
                type="text"
                name="nim"
                value={formData.nim}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 font-medium">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 font-medium">Password Baru:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                placeholder="Kosongkan jika tidak ingin mengganti"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block mb-2 font-medium">Role:</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                required
              >
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
                <option value="admin">admin</option>
              </select>
            </div>

            {/* Tombol */}
            <div className="col-span-2 flex justify-end gap-4 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded text-white ${
                  submitting
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Proses..." : "Update"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
