"use client";

import "react-datepicker/dist/react-datepicker.css";
import React, {useState} from "react";
import {BoardResponse, CategoryResponse, OperationResponse} from "@/app/types";
import {instance} from "@/app/api/instance";
import {Check, Edit2, Plus, Trash, X} from "lucide-react";
import DatePicker from "react-datepicker";

interface BoardProps {
    board: BoardResponse;
    categories: CategoryResponse[];
    operations: OperationResponse[];
    sortBy: string;
    direction: "asc" | "desc";
    onSort: (field: string) => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    fetchOperations: () => void;
}

const columnLabels: Record<string, string> = {
    amount: "Сума",
    category: "Категорія",
    comment: "Коментар",
    date: "Дата",
};

const columns = ["amount", "category", "comment", "date"];

export default function Board({
                                  board,
                                  operations,
                                  categories,
                                  sortBy,
                                  direction,
                                  onSort,
                                  page,
                                  totalPages,
                                  onPageChange,
                                  fetchOperations
                              }: Readonly<BoardProps>) {
    const [adding, setAdding] = useState(false);
    const [newOperation, setNewOperation] = useState({
        date: "",
        categoryId: 0,
        comment: "",
        amount: 0,
        operationType: board.operation_type,
    });
    const [errors, setErrors] = useState<{ amount?: boolean; categoryId?: boolean }>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingOperation, setEditingOperation] = useState({
        amount: 0,
        categoryId: 0,
        comment: "",
        date: null as Date | null,
    });


    const handleCreate = async () => {
        const newErrors = {
            amount: newOperation.amount === undefined || newOperation.amount < 0, // allow 0
            categoryId: !newOperation.categoryId,
        };
        setErrors(newErrors);

        // Stop execution if there are errors
        if (newErrors.amount || newErrors.categoryId) return;
        try {
            await instance.post("/operations/create", {
                board_id: board.id,
                category_id: newOperation.categoryId,
                comment: newOperation.comment,
                amount: Number(newOperation.amount),
                operation_type: newOperation.operationType,
                date: newOperation.date ? new Date(newOperation.date).toISOString() : undefined,
            });
            setAdding(false);
            setNewOperation({date: "", categoryId: 0, comment: "", amount: 0, operationType: "EXPENSE"});
            fetchOperations();
        } catch (err) {
            console.error("Failed to create operation", err);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await instance.delete(`/operations/${id}`);
            fetchOperations();
        } catch (err) {
            console.error("Failed to delete operation", err);
        }
    };

    const handleEdit = (op: OperationResponse) => {
        setEditingId(op.id);
        setEditingOperation({
            amount: op.amount,
            categoryId: op.category?.id || 0,
            comment: op.comment || "",
            date: new Date(op.date),
        });
    };

    const handleSave = async (id: number) => {
        try {
            await instance.put(`/operations/${id}`, {
                board_id: board.id,
                operation_type: board.operation_type,
                amount: editingOperation.amount,
                category_id: editingOperation.categoryId,
                comment: editingOperation.comment,
                date: editingOperation.date?.toISOString(),
            });
            setEditingId(null);
            fetchOperations();
        } catch (err) {
            console.error("Failed to update operation", err);
        }
    };

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
                    <th className="w-12 px-4 py-2 text-center">
                        <Plus
                            size={20}
                            className="text-gray-200 hover:text-indigo-400 cursor-pointer"
                            onClick={() => setAdding(true)}
                        />
                    </th>
                </tr>
                </thead>

                <tbody>
                {adding && (
                    <tr className="border-t border-gray-300 hover:bg-gray-800 transition hover:text-white">
                        <td className="px-2 py-1">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={newOperation.amount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*\.?\d*$/.test(value)) {
                                        setNewOperation({ ...newOperation, amount: value === "" ? 0 : Number(value) });
                                    }
                                }}
                                className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                    errors.amount ? "border-red-800" : "border-gray-300"
                                }`}
                            />
                        </td>
                        <td className="px-2 py-1">
                            <select
                                value={newOperation.categoryId || ""}
                                onChange={(e) => setNewOperation({ ...newOperation, categoryId: Number(e.target.value) })}
                                className={`w-full px-2 py-1 border rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                    errors.categoryId ? "border-red-800" : "border-gray-300"
                                }`}
                            >
                                <option value="" disabled className="text-gray-400">
                                    Виберіть категорію
                                </option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="bg-gray-800 text-white">
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td className="px-2 py-1">
                            <input
                                type="text"
                                value={newOperation.comment}
                                onChange={(e) => setNewOperation({...newOperation, comment: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </td>
                        <td className="px-2 py-1">
                            <DatePicker
                                selected={newOperation.date ? new Date(newOperation.date) : null}
                                onChange={(date: Date | null) =>
                                    setNewOperation({ ...newOperation, date: date ? date.toISOString() : "" })
                                }
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={1}
                                dateFormat="yyyy-MM-dd HH:mm"
                                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 "
                            />
                        </td>
                        <td className="px-2 py-1 flex gap-2 justify-center">
                            <button
                                onClick={handleCreate}
                                className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500 flex items-center justify-center"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                onClick={() => setAdding(false)}
                                className="p-2 bg-red-950 text-white rounded hover:bg-red-800 flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </td>
                    </tr>
                )}

                {operations.length > 0 ? (
                    operations.map((op) => (
                        <tr key={op.id} className="border-t border-gray-300 hover:bg-gray-800 hover:text-white transition">
                            {editingId === op.id ? (
                                <>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={editingOperation.amount}
                                            onChange={(e) => setEditingOperation({...editingOperation, amount: Number(e.target.value)})}
                                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <select
                                            value={editingOperation.categoryId}
                                            onChange={(e) => setEditingOperation({...editingOperation, categoryId: Number(e.target.value)})}
                                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={editingOperation.comment}
                                            onChange={(e) => setEditingOperation({...editingOperation, comment: e.target.value})}
                                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <DatePicker
                                            selected={editingOperation.date} // keep as Date
                                            onChange={(date: Date | null) =>
                                                setEditingOperation({ ...editingOperation, date })
                                            }
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={1}
                                            dateFormat="yyyy-MM-dd HH:mm"
                                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </td>
                                    <td className="px-4 py-2 flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleSave(op.id)}
                                            className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500 flex items-center justify-center"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-2 bg-red-950 text-white rounded hover:bg-red-800 flex items-center justify-center"
                                        >
                                            <X size={18} />
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-4 py-2 ">{op.amount.toFixed(2)}</td>
                                    <td className="px-4 py-2">{op.category?.name}</td>
                                    <td className="px-4 py-2">{op.comment || <span className="italic text-gray-500">—</span>}</td>
                                    <td className="px-4 py-2">
                                        {new Date(op.date).toLocaleString("en-GB", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                            timeZone: "Europe/Kiev",
                                        })}
                                    </td>
                                    <td className="px-4 py-2 flex gap-2 justify-center">
                                        <button onClick={() => handleEdit(op)} className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(op.id)} className="p-2 bg-red-950 text-white rounded hover:bg-red-800">
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400 italic border-t border-gray-300">
                            Немає операцій для відображення
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex space-x-2 justify-center">
                {page > 0 && (
                    <button onClick={() => onPageChange(page - 1)}
                            className="px-3 py-1 border rounded bg-gray-800 text-white">
                        Минула
                    </button>
                )}
                <span className="px-3 py-1">
                    Сторінка {operations.length === 0 ? 0 : page + 1} з {totalPages}
                </span>
                {page + 1 < totalPages && (
                    <button onClick={() => onPageChange(page + 1)}
                            className="px-3 py-1 border rounded bg-gray-800 text-white">
                        Наступна
                    </button>
                )}
            </div>
        </div>
    );
}
