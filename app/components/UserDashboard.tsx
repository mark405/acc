import React, { useState } from "react";

interface Operation {
    id: number;
    type: "Прибуток" | "Зарплата";
    amount: number;
    date: string;
}

const mockOperations: Operation[] = [
    { id: 1, type: "Прибуток", amount: 5000, date: "2025-10-31" },
    { id: 2, type: "Зарплата", amount: 2000, date: "2025-10-30" },
    { id: 3, type: "Прибуток", amount: 1500, date: "2025-10-28" },
    { id: 4, type: "Зарплата", amount: 1000, date: "2025-10-29" },
];

export default function EmployeeDashboard() {
    const [activeTab, setActiveTab] = useState<"table" | "stats">("table");

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">Фінанси</h1>

            {/* Tabs */}
            <div className="flex justify-center mb-6 border-b border-gray-300">
                <button
                    onClick={() => setActiveTab("table")}
                    className={`py-2 px-6 font-medium ${
                        activeTab === "table" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
                    }`}
                >
                    Таблиця
                </button>
                <button
                    onClick={() => setActiveTab("stats")}
                    className={`py-2 px-6 font-medium ${
                        activeTab === "stats" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
                    }`}
                >
                    Статистика
                </button>
            </div>

            {/* Tab content */}
            {activeTab === "table" && (
                <div className="flex justify-center p-4">
                    <table className="min-w-[700px] bg-white border border-gray-300 shadow-md">
                        <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border-b">Тип</th>
                            <th className="py-2 px-4 border-b">Сумма</th>
                            <th className="py-2 px-4 border-b">Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        {mockOperations.map((op) => (
                            <tr key={op.id} className="text-center">
                                <td className="py-2 px-4 border-b">{op.type}</td>
                                <td className="py-2 px-4 border-b">{op.amount.toLocaleString()} $</td>
                                <td className="py-2 px-4 border-b">{op.date}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "stats" && (
                <div className="flex justify-center items-center h-64 bg-gray-50 border border-gray-300">
                    <p className="text-gray-400">Статистика поки пуста</p>
                </div>
            )}
        </div>
    );
}
