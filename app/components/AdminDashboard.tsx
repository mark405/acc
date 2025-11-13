import React, { useEffect, useState } from "react";
import { instance } from "@/app/api/instance";
import { HttpStatusCode } from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

interface MonthStats {
    month: number;
    amount: number;
}

interface StatisticsResponse {
    statistics: MonthStats[];
    year: number;
}

export default function AdminDashboard() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState<MonthStats[]>([]);
    const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

    useEffect(() => {
        instance
            .get<StatisticsResponse>("/stats", { params: { year, type } })
            .then((res) => {
                if (res.status === HttpStatusCode.Ok) {
                    setStats(res.data.statistics);
                }
            })
            .catch(() => {
                setStats([]);
            });
    }, [year, type]);

    const monthNames = [
        "Січень",
        "Лютий",
        "Березень",
        "Квітень",
        "Травень",
        "Червень",
        "Липень",
        "Серпень",
        "Вересень",
        "Жовтень",
        "Листопад",
        "Грудень",
    ];

    // Make sure all 12 months are included
    const chartData = Array.from({ length: 12 }, (_, i) => {
        const m = stats.find((s) => s.month === i + 1);
        return {
            monthName: monthNames[i].slice(0, 3),
            amount: m?.amount ?? 0,
        };
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Статистика</h1>

            {/* Tabs */}
            <div className="flex justify-center gap-5 mb-6 bg-gray-800 p-3 rounded-4xl w-max mx-auto">
                <button
                    onClick={() => setType("EXPENSE")}
                    className={`bg-gray-800 text-white px-4 py-2 rounded-4xl ${
                        type === "EXPENSE" ? "bg-indigo-600 text-white" : "bg-gray-200"
                    }`}
                >
                    Витрати
                </button>
                <button
                    onClick={() => setType("INCOME")}
                    className={`bg-gray-800 text-white px-4 py-2 rounded-4xl ${
                        type === "INCOME" ? "bg-indigo-600 text-white" : "bg-gray-200"
                    }`}
                >
                    Доходи
                </button>
            </div>

            <div className="flex gap-6 items-start h-132">
                {/* Table */}
                <div className="border border-gray-300 shadow bg-white w-1/3 h-full">
                    <table className="w-full text-center">
                        <thead className="bg-gray-100 border-b">
                        <tr className="bg-gray-900  text-white">
                            <th className="py-2 px-4">Місяць</th>
                            <th className="py-2 px-4">Сума</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stats.map((m) => (
                            <tr key={m.month} className="border-b bg-gray-800  text-white hover:bg-gray-700">
                                <td className="py-2 px-4">{monthNames[m.month - 1]}</td>
                                <td className="py-2 px-4 font-medium">{m.amount.toFixed(2)} $</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Chart */}
                <div className="w-2/3 border border-gray-300 shadow h-full bg-gray-800 p-4 rounded">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                            {/* Dark grid */}
                            <CartesianGrid stroke="#4B5563" strokeDasharray="3 3" />

                            {/* X Axis */}
                            <XAxis
                                dataKey="monthName"
                                angle={-30}
                                textAnchor="end"
                                height={60}
                                stroke="#D1D5DB" // light gray labels
                                tick={{ fill: "#D1D5DB", fontSize: 12 }}
                            />

                            {/* Y Axis */}
                            <YAxis
                                stroke="#D1D5DB"
                                tick={{ fill: "#D1D5DB", fontSize: 12 }}
                            />

                            {/* Tooltip */}
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: 6 }}
                                itemStyle={{ color: "#D1D5DB" }}       // color of value
                                labelStyle={{ color: "#D1D5DB" }}      // color of month (label)
                                formatter={(v: number) => `${v.toFixed(2)} ₴`}
                            />

                            {/* Bars */}
                            <Bar
                                dataKey="amount"
                                name={"Сума"}
                                fill="#4f46e5"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* Year navigation */}
            <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    onClick={() => setYear(year - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                >
                    ← Попередній
                </button>
                <span className="text-xl font-semibold">{year}</span>
                <button
                    onClick={() => setYear(year + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                >
                    Наступний →
                </button>
            </div>
        </div>
    );
}
