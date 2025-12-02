"use client";

import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {EmployeeAdvanceResponse, EmployeeFinanceResponse, EmployeeResponse} from "@/app/types";

export default function EmployeePage() {
    const params = useParams();
    const employeeId = Number(params.employeeId);

    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
    const [finances, setFinances] = useState<EmployeeFinanceResponse[]>([]);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const [sortBy, setSortBy] = useState<string>("id");
    const [direction, setDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState<number>(0);
    const [size] = useState<number>(15); // количество записей на страницу
    const [totalPages, setTotalPages] = useState<number>(1);

    const fetchEmployee = async () => {
        try {
            const res = await instance.get(`/employees/${employeeId}`);
            if (res.status === HttpStatusCode.Ok) {
                setEmployee(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch employee:", err);
        }
    };

    const fetchFinances = async () => {
        try {
            const res = await instance.get(`/employee-finances`, {
                params: {employeeId, sort_by: sortBy, direction, page, size}
            });
            if (res.status === HttpStatusCode.Ok) {
                setFinances(res.data.content); // предполагаем, что бэк отдаёт Page-like объект
                setTotalPages(res.data.total_pages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch finances:", err);
        }
    };

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setDirection(direction === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setDirection("asc");
        }
        setPage(0);
    };

    const onPageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) setPage(newPage);
    };

    useEffect(() => {
        if (employeeId) {
            fetchEmployee();
            fetchFinances();
        }
    }, [employeeId, sortBy, direction, page]);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-center">Співробітник {employee?.name}</h1>

            <div className="overflow-visible">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                    <tr className="bg-gray-800 text-white">
                        <th className="px-4 py-2 text-left">Період</th>
                        <th
                            className="px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("incomeQFD")}
                        >
                            Дохід по QFD {sortBy === "incomeQFD" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("paidRef")}
                        >
                            Виплачено реф% {sortBy === "paidRef" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("percentQFD")}
                        >
                            QFD (10% мінус реф%) {sortBy === "percentQFD" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-4 py-2 text-left">Аванс</th>
                    </tr>
                    </thead>

                    <tbody>
                    {finances.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-400 italic">
                                Фінанси не знайдено
                            </td>
                        </tr>
                    )}

                    {finances.map((finance, index) => (
                        <tr key={finance.id} className="border-t border-gray-300">
                            <td className="px-4 py-2">
                                {finance.startDate} – {finance.endDate}
                            </td>
                            <td className="px-4 py-2">{finance.incomeQFD.toLocaleString()}</td>
                            <td className="px-4 py-2">{finance.paidRef}</td>
                            <td className="px-4 py-2">{finance.percentQFD}</td>
                            <td className="px-4 py-2 relative whitespace-nowrap">
                                <button
                                    onClick={() => toggle(index)}
                                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                                >
                                    Показати ({finance.advances.length})
                                </button>
                                {openIndex === index && (
                                    <div
                                        className="absolute left-0 top-full mt-2 bg-gray-800 text-white rounded shadow-lg p-2 w-52 z-50">
                                        {finance.advances.map((a: EmployeeAdvanceResponse) => (
                                            <div key={a.id}
                                                 className="px-2 py-1 border-b border-gray-700 last:border-none">
                                                {a.amount} –{" "}
                                                {new Date(a.date).toLocaleString("en-GB", {
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: false,
                                                    timeZone: "Europe/Kiev",
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="mt-4 flex space-x-2 justify-center">
                    {page > 0 && (
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 0}
                            className="px-3 py-1 border rounded bg-gray-800 text-white disabled:opacity-50"
                        >
                            Минула
                        </button>)}
                    <span className="px-3 py-1">
                        Сторінка {finances.length === 0 ? 0 : page + 1} з {totalPages}
                    </span>
                    {page + 1 < totalPages && (
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page + 1 >= totalPages}
                            className="px-3 py-1 border rounded bg-gray-800 text-white disabled:opacity-50"
                        >
                            Наступна
                        </button>)}
                </div>
            </div>
        </div>
    );
}
