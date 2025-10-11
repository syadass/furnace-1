import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";

export default function TambahOperator() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    namaLengkap: "",
    email: "",
    username: "",
    password: "",
    nim: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Password dan Konfirmasi Password tidak sama!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await axios.post("http://localhost:5000/api/users", {
        nama_lengkap: formData.namaLengkap,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        NIM: formData.nim,
      });

      setMessage("✅ Operator berhasil ditambahkan!");

      // Clear the form data
      setFormData({
        namaLengkap: "",
        email: "",
        username: "",
        password: "",
        nim: "",
        confirmPassword: "",
      });

      // Navigate back to the previous page after 1 second
      setTimeout(() => {
        // PERBAIKAN: Menggunakan navigate(-1) untuk kembali ke halaman sebelumnya
        navigate(-1); 
      }, 1000);

    } catch (error) {
      console.error("Error:", error.response || error.message);
      const errorMessage = error.response?.data?.message || "❌ Gagal menambahkan operator! Terjadi kesalahan pada server atau jaringan.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear form and message (optional, but good practice)
    setFormData({
      namaLengkap: "",
      email: "",
      username: "",
      password: "",
      nim: "",
      confirmPassword: "",
    });
    setMessage("");
    
    // PERBAIKAN: Menggunakan navigate(-1) untuk kembali ke halaman sebelumnya
    navigate(-1);
  };

  return (
    <div className="flex min-h-screen bg-blue-100">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 pt-[60px]"> 
        <Header />

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#3674B5]">
            Tambah Data Operator
          </h2>

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
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                required
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

            {/* Password */}
            <div>
              <label className="block mb-2 font-medium">Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
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
                required
              />
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block mb-2 font-medium">Konfirmasi Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border rounded shadow-sm"
                required
              />
            </div>

            {/* Tombol */}
            <div className="col-span-2 flex justify-end gap-4 mt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center px-4 py-2 text-white rounded-lg shadow-md transition transform ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#3674B5] to-[#133E87] hover:opacity-90 hover:scale-105"
                }`}
              >
                {loading ? "Proses..." : "Tambah"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center justify-center px-4 py-2 text-white rounded-lg shadow-md bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition transform hover:scale-105"
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