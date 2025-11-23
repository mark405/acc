"use client";

import React, {SetStateAction, useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {useAuth} from "@/app/components/AuthProvider";
import {HistoryResponse} from "@/app/types";

const historyTypes = ["USER", "OPERATION"];

export default function HistoryPage() {
    const [histories, setHistories] = useState<HistoryResponse[]>([]);
    const [username, setUsername] = useState("");
    const [type, setType] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [direction, setDirection] = useState("desc");
    const [page, setPage] = useState(0);
    const [size] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const {isLoggedIn} = useAuth();

    const fetchHistories = async () => {
        try {
            const params = {
                username: username || undefined,
                type: type || undefined,
                sort_by: sortBy,
                direction,
                page,
                size,
            };

            const response = await instance.get("/histories", {params});

            setHistories(response.data.content);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error("Error fetching histories:", error);
        }
    };

    useEffect(() => {
        setPage(0);
    }, [username, type]);

    useEffect(() => {
        fetchHistories();
    }, [username, type, sortBy, direction, page, isLoggedIn]);

    const handleSort = (field: SetStateAction<string>) => {
        if (sortBy === field) {
            setDirection(direction === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setDirection("asc");
        }
    };

    const renderBodyMessage = (bodyJson: any) => {
        try {
            const body = bodyJson;
            switch (body.type) {
                case "USER_CREATED":
                    return <>Користувач <strong>{body.username}</strong> створений</>;
                case "USER_PASSWORD_CHANGED":
                    return <>Пароль користувача <strong>{body.username}</strong> змінено</>;
                case "OPERATION_CREATED": {
                    const operationName = body.operationType === "EXPENSE" ? "Витрати" : "Доходи";
                    return (
                        <>Операція <strong>{operationName}</strong> створена на дошці <strong>{body.board}</strong> в категорії <strong>{body.category}</strong></>
                    );
                }
                case "OPERATION_UPDATED": {
                    const operationName = body.operationType === "EXPENSE" ? "Витрати" : "Доходи";
                    return (
                        <>Операція <strong>{operationName}</strong> оновлена на дошці <strong>{body.board}</strong> в категорії <strong>{body.category}</strong></>
                    );
                }
                case "OPERATION_DELETED": {
                    const operationName = body.operationType === "EXPENSE" ? "Витрати" : "Доходи";
                    return (
                        <>Операція <strong>{operationName}</strong> видалена на дошці <strong>{body.board}</strong> в категорії <strong>{body.category}</strong></>
                    );
                }
                default:
                    return JSON.stringify(body);
            }
        } catch (e) {
            return bodyJson; // fallback if JSON parsing fails
        }
    };


    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-center">Історія дій</h1>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-4 justify-center">
                <input
                    type="text"
                    placeholder="Шукати по логіну"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border rounded px-2 py-1"
                    autoComplete="off"
                />
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Усі типи</option>
                    {historyTypes.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse border border-gray-300">
                    <thead>
                    <tr className="bg-gray-800 text-white">
                        <th
                            className="w-1/5 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("userId")}
                        >
                            Логін {sortBy === "userId" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="w-1/5 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("type")}
                        >
                            Тип {sortBy === "type" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="w-2/5 px-4 py-2 text-left">Повідомлення</th>
                        <th
                            className="w-1/5 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("date")}
                        >
                            Дата {sortBy === "date" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {histories.map((h) => (
                        <tr key={h.id} className="border-t border-gray-300 ">
                            <td className="px-4 py-2 text-left">{h.user.username}</td>
                            <td className="px-4 py-2 text-left">{h.type}</td>
                            <td className="px-4 py-2 text-left">{renderBodyMessage(h.body)}</td>
                            <td className="w-1/5 px-4 py-2 text-left">
                                {new Date(h.date).toLocaleString("en-GB", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                    timeZone: "Europe/Kiev",
                                })}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex space-x-2 justify-center">
                {page > 0 && (
                    <button
                        onClick={() => setPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                    >
                        Минула
                    </button>
                )}
                <span className="px-3 py-1">
                    Сторінка {histories.length === 0 ? 0 : page + 1} з {totalPages}
                </span>
                {page + 1 < totalPages && (
                    <button
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                    >
                        Наступна
                    </button>
                )}
            </div>
        </div>
    );
}
