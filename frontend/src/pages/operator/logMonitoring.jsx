import React from 'react';
import Header from "../../components/operator/header";
import { Download, Gauge, User, Loader2, LineChart as ChartIcon, Search } from "lucide-react";
import { format } from 'date-fns';

// Import hook dan komponen yang sudah dipisah
import { useLogMonitoring } from '../../services/useLogMonitoring';
import LogChart from '../../components/operator/logMonitoring/logChart';
import SummaryCards from '../../components/operator/logMonitoring/logSummary';
import LogSelector from '../../components/operator/logMonitoring/logSelector';

const LogMonitoring = () => {
    // Panggil custom hook untuk mendapatkan semua state dan fungsi
    const {
        currentUser, fullName, availableLogs, totalUniqueFurnaces,
        selectedDate, selectedFurnace, selectedSession,
        availableDates, availableFurnaces, availableSessions,
        showChart, chartData,
        isLoading, isChartLoading, isSessionLoading,
        setSelectedDate, setSelectedFurnace, setSelectedSession,
        handleDownload, handleViewChart
    } = useLogMonitoring();

    const CardStyle = "bg-white p-6 md:p-10 rounded-2xl shadow-xl lg:shadow-2xl border-t-8 border-blue-600 transition-all duration-300 hover:shadow-2xl hover:border-blue-700 transform hover:-translate-y-0.5";

    // Fungsi format waktu sesi, bisa dipindah ke utils jika perlu
    const formatSessionTime = (session) => {
        if (!session || !session.startTime) return "Sesi tidak valid";
        const start = format(new Date(session.startTime), 'HH:mm:ss');
        const end = session.endTime ? format(new Date(session.endTime), 'HH:mm:ss') : 'Sekarang';
        return `Sesi ${start} - ${end}`;
    };

    return (
        <div className="min-h-screen bg-sky-100 font-sans">
            <Header />
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-4 border-blue-200 pb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Monitor Log Sesi</h1>
                    <div className="flex items-center text-md text-gray-700 font-semibold mt-3 md:mt-0 p-2 bg-white rounded-lg shadow-md border border-gray-200">
                        <User size={20} className="mr-2 text-blue-600" />
                        Operator: <span className="ml-1 text-blue-700 font-bold">{fullName} {currentUser?.id && `(ID: ${currentUser.id})`}</span>
                    </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                    <Gauge size={20} className="mr-2 text-gray-500" /> Ringkasan Ketersediaan Log
                </h2>

                <SummaryCards 
                    logDaysCount={Object.keys(availableLogs).length} 
                    uniqueFurnacesCount={totalUniqueFurnaces} 
                />
                
                <div className={CardStyle}>
                    <h2 className="text-2xl font-extrabold text-gray-800 mb-8 flex items-center border-b pb-3 text-blue-600">
                        <Download size={28} className="mr-3 text-blue-600" />
                        Pilih Data Log Sesi
                    </h2>
                    
                    <LogSelector
                        selectedDate={selectedDate} setSelectedDate={setSelectedDate} availableDates={availableDates}
                        selectedFurnace={selectedFurnace} setSelectedFurnace={setSelectedFurnace} availableFurnaces={availableFurnaces}
                        selectedSession={selectedSession} setSelectedSession={setSelectedSession} availableSessions={availableSessions}
                        isSessionLoading={isSessionLoading}
                    />

                    <div className="pt-8 border-t-2 border-blue-100 flex flex-col md:flex-row justify-center items-center gap-4">
                        <button
                            onClick={handleViewChart}
                            disabled={!selectedSession || isChartLoading}
                            className={`flex items-center space-x-3 text-white px-8 py-4 rounded-full shadow-xl transition-all duration-300 transform ${!selectedSession || isChartLoading ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.05] active:scale-[0.98]'}`}
                        >
                            {isChartLoading ? <Loader2 size={24} className="animate-spin" /> : <ChartIcon size={24} />}
                            <span className="font-bold text-lg">
                                {isChartLoading ? "Memuat..." : (showChart ? "Sembunyikan Grafik" : "Lihat Grafik Sesi")}
                            </span>
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!selectedSession || isLoading}
                            className={`flex items-center space-x-3 text-white px-8 py-4 rounded-full shadow-xl transition-all duration-300 transform ${!selectedSession || isLoading ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-green-600 hover:bg-green-700 hover:scale-[1.05] active:scale-[0.98]'}`}
                        >
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
                            <span className="font-bold text-lg">
                                {isLoading ? "Mengunduh..." : "Unduh CSV Sesi"}
                            </span>
                        </button>
                    </div>
                </div>
                
                {showChart && (
                    <div className="mt-8 bg-white p-6 rounded-2xl shadow-xl border-t-8 border-indigo-500 animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center border-b pb-3 text-indigo-600">
                            <ChartIcon size={28} className="mr-3 text-indigo-500" />
                            Grafik Log Sesi - {selectedFurnace} - {formatSessionTime(selectedSession)}
                        </h2>
                        {isChartLoading ? (
                            <div className="flex justify-center items-center h-64 flex-col text-gray-600">
                                <Loader2 size={48} className="animate-spin text-indigo-500" />
                                <p className="mt-4 text-lg font-semibold">Memuat data grafik...</p>
                            </div>
                        ) : (
                            <LogChart data={chartData} />
                        )}
                    </div>
                )}
                
                <div className="mt-8 p-6 bg-blue-100 rounded-xl border border-blue-300 shadow-md">
                    <p className="text-md text-blue-800 font-semibold flex items-center">
                        <Search size={18} className="mr-2 text-blue-600" />
                        Status Log: Total **{Object.keys(availableLogs).length}** hari log dan **{totalUniqueFurnaces}** ID tungku unik tersedia untuk Operator **{fullName}**.
                    </p>
                </div>
            </div>
            
            <style jsx global>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default LogMonitoring;