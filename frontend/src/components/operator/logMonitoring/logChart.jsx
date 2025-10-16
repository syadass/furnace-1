import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import id from 'date-fns/locale/id';

const LogChart = ({ data }) => { 
    const formatXAxis = (tickItem) => {
        try {
            return format(new Date(tickItem), 'HH:mm:ss');
        } catch (error) {
            return tickItem;
        }
    };

    if (!data || !Array.isArray(data) || data.length === 0) {
        return <p className="text-center text-gray-500 py-10">Data tidak ditemukan untuk sesi yang dipilih.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={formatXAxis} angle={-30} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy, HH:mm:ss', { locale: id })} />
                <Legend />
                <Line type="monotone" dataKey="suhu" stroke="#ef4444" name="Suhu (°C)" connectNulls />
                <Line type="monotone" dataKey="tekanan" stroke="#3b82f6" name="Tekanan (Pa)" connectNulls />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default LogChart;