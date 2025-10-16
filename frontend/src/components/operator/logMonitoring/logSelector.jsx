import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, HardHat, Clock, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import id from 'date-fns/locale/id';

const LogSelector = ({
    selectedDate, setSelectedDate, availableDates,
    selectedFurnace, setSelectedFurnace, availableFurnaces,
    selectedSession, setSelectedSession, availableSessions, isSessionLoading
}) => {
    const [isFurnaceDropdownOpen, setIsFurnaceDropdownOpen] = useState(false);
    const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

    const formatSessionTime = (session) => {
        if (!session || !session.startTime) return "Sesi tidak valid";
        const start = format(new Date(session.startTime), 'HH:mm:ss');
        const end = session.endTime ? format(new Date(session.endTime), 'HH:mm:ss') : 'Sekarang';
        return `Sesi ${start} - ${end}`;
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedFurnace(null);
        setSelectedSession(null);
    };
    
    const handleFurnaceChange = (furnaceId) => {
        setSelectedFurnace(furnaceId);
        setSelectedSession(null);
        setIsFurnaceDropdownOpen(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* 1. Pemilih Tanggal */}
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Calendar size={18} className="inline mr-2 text-blue-500" /> Tanggal Log:
                </label>
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    locale={id}
                    dateFormat="dd MMMM yyyy"
                    includeDates={availableDates}
                    placeholderText="Pilih Tanggal Tersedia"
                    className="w-full border border-blue-300 rounded-xl p-4 shadow-inner text-lg font-medium focus:ring-blue-500 focus:border-blue-500 transition duration-150 cursor-pointer text-gray-700 hover:border-blue-500"
                    wrapperClassName="w-full"
                    dropdownMode="select"
                />
                <p className="text-sm text-gray-500 mt-3 flex items-center">
                    <CheckCircle size={14} className="mr-1 text-green-500" /> Pilih tanggal log yang tersedia.
                </p>
            </div>

            {/* 2. Pemilih Furnace ID */}
            <div className="relative p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <HardHat size={18} className="inline mr-2 text-blue-500" /> ID Tungku:
                </label>
                <button
                    type="button"
                    onClick={() => selectedDate && availableFurnaces.length > 0 && setIsFurnaceDropdownOpen(!isFurnaceDropdownOpen)}
                    className={`w-full flex justify-between items-center border rounded-xl p-4 shadow-sm transition duration-150 text-left text-lg font-medium ${selectedDate && availableFurnaces.length > 0 ? 'bg-white border-blue-300 hover:border-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'}`}
                    disabled={!selectedDate || availableFurnaces.length === 0}
                >
                    <span className={selectedFurnace ? 'text-gray-900 font-bold' : 'text-gray-500'}>
                        {selectedFurnace || (selectedDate && availableFurnaces.length > 0 ? "Pilih ID Tungku" : "Pilih tanggal dahulu")}
                    </span>
                    <ChevronDown size={20} className={`ml-2 transform ${isFurnaceDropdownOpen ? 'rotate-180' : 'rotate-0'} transition-transform`} />
                </button>
                {isFurnaceDropdownOpen && selectedDate && availableFurnaces.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto border border-blue-200 animate-fade-in">
                        {availableFurnaces.map((furnaceId) => (
                            <div key={furnaceId} className="p-4 text-md hover:bg-blue-50 cursor-pointer flex justify-between items-center font-medium transition-colors" onClick={() => handleFurnaceChange(furnaceId)}>
                                <span>{furnaceId}</span>
                                {selectedFurnace === furnaceId && <span className="text-green-600 font-bold">✓ Dipilih</span>}
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-sm text-gray-500 mt-3 flex items-center">
                    <CheckCircle size={14} className="mr-1 text-green-500" /> Daftar tungku yang aktif pada tanggal yang dipilih.
                </p>
            </div>

            {/* 3. Dropdown baru untuk Sesi */}
            <div className="relative p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Clock size={18} className="inline mr-2 text-blue-500" /> Sesi:
                </label>
                <button
                    type="button"
                    onClick={() => !isSessionLoading && availableSessions.length > 0 && setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                    className={`w-full flex justify-between items-center border rounded-xl p-4 shadow-sm transition duration-150 text-left text-lg font-medium ${!selectedFurnace || isSessionLoading ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-blue-300 hover:border-blue-500'}`}
                    disabled={!selectedFurnace || isSessionLoading}
                >
                    <span className={selectedSession ? 'text-gray-900 font-bold' : 'text-gray-500'}>
                        {isSessionLoading ? 'Memuat...' : selectedSession ? formatSessionTime(selectedSession) : (availableSessions.length > 0 ? 'Pilih Sesi' : 'Sesi tidak tersedia')}
                    </span>
                    {isSessionLoading ? <Loader2 size={20} className="animate-spin ml-2" /> : <ChevronDown size={20} className={`ml-2 transform ${isSessionDropdownOpen ? 'rotate-180' : 'rotate-0'} transition-transform`} />}
                </button>
                {isSessionDropdownOpen && availableSessions.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto border border-blue-200 animate-fade-in">
                        {availableSessions.map((sesi) => (
                            <div key={sesi.session_id} className="p-4 text-md hover:bg-blue-50 cursor-pointer flex justify-between items-center font-medium transition-colors" onClick={() => { setSelectedSession(sesi); setIsSessionDropdownOpen(false); }}>
                                <span>{formatSessionTime(sesi)}</span>
                                {selectedSession?.session_id === sesi.session_id && <span className="text-green-600 font-bold">✓ Dipilih</span>}
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-sm text-gray-500 mt-3 flex items-center">
                    <CheckCircle size={14} className="mr-1 text-green-500" /> Pilih sesi perekaman data yang tersedia.
                </p>
            </div>
        </div>
    );
};

export default LogSelector;