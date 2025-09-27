import Header from "../../components/viewer/header"; 

const ViewerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Konten */}
      <main className="p-6">
        <h1 className="text-2xl font-bold">Viewer Dashboard</h1>
        <p className="mt-2 text-gray-700">
          Selamat datang Viewer! Anda hanya bisa melihat data monitoring.
        </p>
      </main>
    </div>
  );
};

export default ViewerDashboard;
