import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/sidebar";
import Header from "../../components/admin/header";


export default function LihatDataOperator() {
  const location = useLocation();
  const navigate = useNavigate();
  const operator = location.state?.operator;

  if (!operator) {
    return (
      <div className="p-6">
        <p>Data operator tidak ditemukan.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center px-4 py-2 text-white rounded-lg shadow-md bg-gradient-to-r from-[#3674B5] to-[#133E87] hover:opacity-90 hover:scale-105 transition transform"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-blue-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 pt-[60px]">
        <Header />

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#3674B5]">
            Detail Operator
          </h2>

          <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6">
            {/* Nama Lengkap */}
            <div>
              <label className="block mb-2 font-medium">Nama Lengkap:</label>
              <input
                type="text"
                value={operator.nama_lengkap}
                readOnly
                className="w-full p-2 border rounded shadow-sm bg-gray-100"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block mb-2 font-medium">Username:</label>
              <input
                type="text"
                value={operator.username}
                readOnly
                className="w-full p-2 border rounded shadow-sm bg-gray-100"
              />
            </div>

            {/* NIM */}
            <div>
              <label className="block mb-2 font-medium">NIM:</label>
              <input
                type="text"
                value={operator.NIM}
                readOnly
                className="w-full p-2 border rounded shadow-sm bg-gray-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 font-medium">Email:</label>
              <input
                type="text"
                value={operator.email}
                readOnly
                className="w-full p-2 border rounded shadow-sm bg-gray-100"
              />
            </div>

            {/* Password (plaintext) */}
            <div>
              <label className="block mb-2 font-medium">Password:</label>
              <input
                type="text"
                value={operator.password ?? ""}
                readOnly
                className="w-full p-2 border rounded shadow-sm bg-gray-100"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block mb-2 font-medium">Role:</label>
              <input
                type="text"
                value={operator.role}
                readOnly
                className="w-full p-2 border rounded shadow-sm bg-gray-100"
              />
            </div>

            {/* Tombol Kembali */}
            <div className="col-span-2 flex justify-end mt-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center px-4 py-2 text-white rounded-lg shadow-md bg-gradient-to-r from-[#3674B5] to-[#133E87] hover:opacity-90 hover:scale-105 transition transform"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
