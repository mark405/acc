"use client";

import {useEffect, useRef, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useParams} from "next/navigation";
import Board from "@/app/components/Board";
import BoardFilters from "@/app/components/filters/BoardFilters";
import {BoardResponse, CategoryResponse, OperationResponse} from "@/app/types";

export default function ExpenseBoardPage() {
    const params = useParams();
    const boardId = Number(params.boardId);

    const [board, setBoard] = useState<BoardResponse | null>(null);
    const [operations, setOperations] = useState<OperationResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<number[]>([]); // <-- multiple
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
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
        }
    };

    useEffect(() => {
        if (boardId) {
            fetchBoard();
            fetchCategories();
            fetchOperations();
        }
    }, [boardId, page, sortBy, direction, categoryFilter, commentFilter, startDate, endDate]);

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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-10 text-center">
                {board ? `Витрати: ${board.name}` : ``}
            </h1>

            <div className="flex gap-6">
                {/* LEFT SIDEBAR */}
                <BoardFilters
                    categories={categories}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    renamingCategory={renamingCategory}
                    setRenamingCategory={setRenamingCategory}
                    submitNewCategory={submitNewCategory}
                    deleteCategory={deleteCategory}
                    renameCategory={renameCategory}
                    commentFilter={commentFilter}
                    setCommentFilter={setCommentFilter}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    addingCategory={addingCategory}
                    setAddingCategory={setAddingCategory}
                    newCategoryName={newCategoryName}
                    setNewCategoryName={setNewCategoryName}
                />

                <Board
                    operations={operations}
                    sortBy={sortBy}
                    direction={direction}
                    onSort={handleSort}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
