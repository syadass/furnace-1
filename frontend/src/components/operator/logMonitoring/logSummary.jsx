import React from 'react';
import { Calendar, HardHat } from 'lucide-react';

const SummaryCards = ({ logDaysCount, uniqueFurnacesCount }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-green-500 transition-transform duration-300 hover:scale-[1.01] hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-500 uppercase">Total Hari Log Tersedia</p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-4xl font-extrabold text-green-600">{logDaysCount}</span>
                    <Calendar size={36} className="text-green-300 opacity-70" />
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-purple-500 transition-transform duration-300 hover:scale-[1.01] hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-500 uppercase">Total ID Tungku Unik</p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-4xl font-extrabold text-purple-600">{uniqueFurnacesCount}</span>
                    <HardHat size={36} className="text-purple-300 opacity-70" />
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;