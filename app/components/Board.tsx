"use client";

import React from "react";
import {OperationResponse} from "@/app/types";

interface BoardProps {
    operations: OperationResponse[];
    sortBy: string;
    direction: "asc" | "desc";
    onSort: (field: string) => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const columnLabels: Record<string, string> = {
    amount: "Сума",
    category: "Категорія",
    comment: "Коментар",
    date: "Дата",
};

const columns = ["amount", "category", "comment", "date"];

export default function Board({
                                  operations,
                                  sortBy,
                                  direction,
                                  onSort,
                                  page,
                                  totalPages,
                                  onPageChange,
                              }: Readonly<BoardProps>) {
    return (
        <div className="overflow-x-auto flex-1">
            <table className="min-w-full table-fixed border-collapse border border-gray-300">
                <thead>
                <tr className="bg-gray-800 text-white">
                    {columns.map((field) => (
                        <th
                            key={field}
                            className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => onSort(field)}
                        >
                            {columnLabels[field]} {sortBy === field && (direction === "asc" ? "↑" : "↓")}
                        </th>
                    ))}
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
                                {op.comment || <span className="italic text-gray-500">—</span>}
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

            {/* Pagination */}
            <div className="mt-4 flex space-x-2 justify-center">
                {page > 0 && (
                    <button
                        onClick={() => onPageChange(page - 1)}
                        className="px-3 py-1 border rounded bg-gray-800 text-white"
                    >
                        Минула
                    </button>
                )}
                <span className="px-3 py-1">Сторінка {operations.length === 0 ? 0 : page + 1} з {totalPages}</span>
                {page + 1 < totalPages && (
                    <button
                        onClick={() => onPageChange(page + 1)}
                        className="px-3 py-1 border rounded bg-gray-800 text-white"
                    >
                        Наступна
                    </button>
                )}
            </div>
        </div>
    );
}
