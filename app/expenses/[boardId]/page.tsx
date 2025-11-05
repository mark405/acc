"use client";

import {useEffect, useRef, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useParams} from "next/navigation";
import {Plus} from "lucide-react";

interface OperationResponse {
    id: number;
    amount: number;
    comment?: string;
    operation_type: "EXPENSE" | "INCOME";
    category: { id: number; name: string };
    date: string;
}


interface CategoryResponse {
    id: number;
    name: string;
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
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<number[]>([]); // <-- multiple
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [contextMenu, setContextMenu] = useState<{ id: number } | null>(null);
    const [renamingCategory, setRenamingCategory] = useState<{ id: number; name: string } | null>(null);
    const categoryInputRef = useRef<HTMLInputElement>(null);
    const [commentFilter, setCommentFilter] = useState<string>("");
    const [startDate, setStartDate] = useState<string | "">("");
    const [endDate, setEndDate] = useState<string | "">("");
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

    const fetchCategories = async () => {
        try {
            const res = await instance.get("/categories");
            if (res.status === HttpStatusCode.Ok) {
                setCategories(res.data ?? []);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    };

    const fetchOperations = async () => {
        if (!boardId) return;

        try {
            const body = {
                board_id: boardId,
                type: "EXPENSE",
                page,
                size,
                sort_by: sortBy,
                direction,
                category_ids: categoryFilter || [],
                comment: commentFilter || undefined,
                start_date: startDate
                    ? new Date(`${startDate}T00:00:00.000Z`).toISOString()
                    : undefined,
                end_date: endDate
                    ? new Date(`${endDate}T23:59:59.999Z`).toISOString()
                    : undefined,
            };

            const res = await instance.post("/operations", body);

            if (res.status === HttpStatusCode.Ok) {
                setOperations(res.data.content ?? []);
                setTotalPages(res.data.total_pages ?? 1);
            }
        } catch (err) {
            console.error("Failed to fetch operations:", err);
        }
    };


    const renameCategory = async (id: number, name: string) => {
        try {
            const res = await instance.put(`/categories/${id}`, {name});
            if (res.status === HttpStatusCode.Ok) {
                setCategories(prev =>
                    prev.map(c => (c.id === id ? {...c, name} : c))
                );
            }
        } catch (err) {
            console.error("Failed to rename category:", err);
        } finally {
            setRenamingCategory(null);
        }
    };

    const deleteCategory = async (id: number) => {
        try {
            const res = await instance.delete(`/categories/${id}`);
            if (res.status === HttpStatusCode.NoContent) {
                setCategories(prev => prev.filter(c => c.id !== id));
                setCategoryFilter(prev => prev.filter(fid => fid !== id));
            }
        } catch (err) {
            console.error("Failed to delete category:", err);
        } finally {
            setContextMenu(null);
        }
    };

    useEffect(() => {
        const close = () => setContextMenu(null);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    useEffect(() => {
        if (boardId) {
            fetchBoard();
            fetchCategories();
            fetchOperations();
        }
    }, [boardId, page, sortBy, direction, categoryFilter, commentFilter, startDate, endDate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                addingCategory &&
                categoryInputRef.current &&
                !categoryInputRef.current.contains(event.target as Node)
            ) {
                setAddingCategory(false);
                setNewCategoryName("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [addingCategory]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setDirection(direction === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setDirection("asc");
        }
    };

    const submitNewCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) return;

        try {
            const res = await instance.post("/categories", {name});
            if (res.status === HttpStatusCode.Created) {
                setNewCategoryName("");
                setAddingCategory(false);
                await fetchCategories();
            }
        } catch (err) {
            console.error("Failed to add category:", err);
        }
    };

    const toggleCategoryFilter = (id: number) => {
        setCategoryFilter(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
        setPage(0);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">
                {board ? `Витрати: ${board.name}` : ``}
            </h1>

            <div className="flex gap-6">
                {/* LEFT SIDEBAR */}
                <div className="w-64 flex-shrink-0 space-y-4 bg-gray-900 p-4 rounded-lg shadow-lg">
                    {/* Comment Filter */}
                    <div className="flex flex-col space-y-1">
                        <input
                            type="text"
                            value={commentFilter}
                            onChange={(e) => {
                                setCommentFilter(e.target.value);
                                setPage(0);
                            }}
                            placeholder="Коментар..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-white text-sm font-semibold">Дата</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(0);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(0);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-white text-sm font-semibold">Категорії</span>
                            <Plus
                                size={20}
                                className="text-gray-400 hover:text-indigo-400 cursor-pointer"
                                onClick={() => setAddingCategory(true)}
                            />
                        </div>

                        {addingCategory && (
                            <input
                                ref={categoryInputRef}
                                autoFocus
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") submitNewCategory();
                                    if (e.key === "Escape") {
                                        setAddingCategory(false);
                                        setNewCategoryName("");
                                    }
                                }}
                                placeholder="Нова категорія…"
                                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        )}

                        <div className="flex flex-col space-y-1 max-h-64 overflow-y-auto">
                            {categories.map((c) => (
                                <div key={c.id} className="relative">
                                    {renamingCategory?.id === c.id ? (
                                        <input
                                            autoFocus
                                            value={renamingCategory.name}
                                            onChange={(e) =>
                                                setRenamingCategory(prev =>
                                                    prev ? {...prev, name: e.target.value} : prev
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") renameCategory(c.id, renamingCategory.name.trim());
                                                if (e.key === "Escape") setRenamingCategory(null);
                                            }}
                                            className="w-full px-2 py-1 rounded bg-gray-700 text-white"
                                        />
                                    ) : (
                                        <div
                                            onClick={() => toggleCategoryFilter(c.id)}
                                            onDoubleClick={() => setRenamingCategory({id: c.id, name: c.name})}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setContextMenu({id: c.id});
                                            }}
                                            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                                                categoryFilter.includes(c.id)
                                                    ? "bg-indigo-500 text-white"
                                                    : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                                            }`}
                                        >
                                            {c.name}
                                        </div>
                                    )}

                                    {contextMenu?.id === c.id && (
                                        <div
                                            className="absolute right-0 mt-1 bg-gray-700 text-white rounded shadow-md w-36 z-50">
                                            <button
                                                onClick={() => setRenamingCategory({id: c.id, name: c.name})}
                                                className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-800"
                                            >
                                                Редагувати
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(c.id)}
                                                className="block w-full text-left px-2 py-1 text-sm hover:bg-red-600"
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
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
            </div>
        </div>
    );
}
