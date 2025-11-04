"use client";

import {useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useParams} from "next/navigation";

interface OperationResponse {
    id: number;
    amount: number;
    comment?: string;
    operation_type: "EXPENSE" | "INCOME";
    category: { id: number; name: string };
    date: string;
}

interface BoardResponse {
    id: number;
    name: string;
}

export default function ExpenseBoardPage() {
    const params = useParams();
    const boardId = Number(params.boardId);

    const [board, setBoard] = useState<BoardResponse | null>(null);
    const [operations, setOperations] = useState<OperationResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [sortBy, setSortBy] = useState("date");
    const [direction, setDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(0);
    const [size] = useState(25);
    const [totalPages, setTotalPages] = useState(1);

    const fetchBoard = async () => {
        try {
            const res = await instance.get(`/boards/${boardId}`);
            if (res.status === HttpStatusCode.Ok) {
                setBoard(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch board:", err);
        }
    };

    const fetchOperations = async () => {
        if (!boardId) return;
        setLoading(true);

        try {
            const params = {
                board_id: boardId,
                type: "EXPENSE",
                page,
                size,
                sort_by: sortBy,
                direction,
            };

            const res = await instance.get("/operations", {params});

            if (res.status === HttpStatusCode.Ok) {
                setOperations(res.data.content ?? []);
                setTotalPages(res.data.total_pages ?? 1);
            }
        } catch (err) {
            console.error("Failed to fetch operations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (boardId) {
            fetchBoard();
            fetchOperations();
        }
    }, [boardId, page, sortBy, direction]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setDirection(direction === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setDirection("asc");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">
                {board ? `Витрати: ${board.name}` : `Витрати по таблиці #${boardId}`}
            </h1>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse border border-gray-300">
                    <thead>
                    <tr className="bg-gray-800 text-white">
                        <th
                            className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("amount")}
                        >
                            Сума {sortBy === "amount" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("category")}
                        >
                            Категорія {sortBy === "category" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("comment")}
                        >
                            Коментар {sortBy === "comment" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("date")}
                        >
                            Дата {sortBy === "date" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {operations.length > 0 ? (
                        operations.map((op) => (
                            <tr
                                key={op.id}
                                className="border-t border-gray-300 hover:bg-gray-800 transition"
                            >
                                <td className="px-4 py-2 text-left">
                                    {new Date(op.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-left">{op.category?.name}</td>
                                <td className="px-4 py-2 text-left text-gray-300">
                                    {op.comment || (
                                        <span className="italic text-gray-500">—</span>
                                    )}
                                </td>
                                <td
                                    className={`px-4 py-2 text-right font-semibold ${
                                        op.operation_type === "EXPENSE"
                                            ? "text-red-400"
                                            : "text-green-400"
                                    }`}
                                >
                                    {op.operation_type === "EXPENSE" ? "-" : "+"}
                                    {op.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={4}
                                className="text-center py-8 text-gray-400 italic border-t border-gray-300"
                            >
                                Немає операцій для відображення
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex space-x-2 justify-center">
                {page > 0 && (
                    <button
                        onClick={() => setPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded bg-gray-800 text-white"
                    >
                        Минула
                    </button>
                )}
                <span className="px-3 py-1">
                            Сторінка {operations.length === 0 ? 0 : page + 1} з {totalPages}
                        </span>
                {page + 1 < totalPages && (
                    <button
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded bg-gray-800 text-white"
                    >
                        Наступна
                    </button>
                )}
            </div>
        </div>
    );
}
