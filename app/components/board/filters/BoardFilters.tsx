"use client";

import {useEffect, useRef} from "react";
import {CategoryResponse} from "@/app/types";
import CommentFilter from "@/app/components/board/filters/CommentFilters";
import CategoryFilters from "@/app/components/board/filters/CategoryFilters";

interface BoardFiltersProps {
    categories: CategoryResponse[];
    categoryFilter: number[];
    setCategoryFilter: (ids: number[]) => void;
    renamingCategory: { id: number; name: string } | null;
    setRenamingCategory: (val: { id: number; name: string } | null) => void;
    submitNewCategory: (name: string) => void;
    deleteCategory: (id: number) => void;
    renameCategory: (id: number, name: string) => void;
    commentFilter: string;
    setCommentFilter: (val: string) => void;
    startDate: string | "";
    setStartDate: (val: string) => void;
    endDate: string | "";
    setEndDate: (val: string) => void;
    addingCategory: boolean;
    setAddingCategory: (val: boolean) => void;
    newCategoryName: string;
    setNewCategoryName: (val: string) => void;
}

export default function BoardFilters({
                                         categories,
                                         categoryFilter,
                                         setCategoryFilter,
                                         renamingCategory,
                                         setRenamingCategory,
                                         submitNewCategory,
                                         deleteCategory,
                                         renameCategory,
                                         commentFilter,
                                         setCommentFilter,
                                         startDate,
                                         setStartDate,
                                         endDate,
                                         setEndDate,
                                         addingCategory,
                                         setAddingCategory,
                                         newCategoryName,
                                         setNewCategoryName,
                                     }: Readonly<BoardFiltersProps>) {
    const categoryInputRef = useRef<HTMLInputElement>(null);

    // Close adding category input when clicked outside
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

    return (
    <div className="w-full p-4 grid grid-cols-3 gap-6">

        {/* Labels row */}
        <div className="text-white text-sm font-semibold">Фільтр по категоріям</div>
        <div className="text-white text-sm font-semibold">Фільтр по даті</div>
        <div className="text-white text-sm font-semibold">Фільтр по коментарям</div>

        {/* Inputs row */}
        <div className="min-w-[300px] flex flex-col gap-3">
            <CategoryFilters
                categories={categories}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                renamingCategory={renamingCategory}
                setRenamingCategory={setRenamingCategory}
                submitNewCategory={submitNewCategory}
                deleteCategory={deleteCategory}
                renameCategory={renameCategory}
                addingCategory={addingCategory}
                setAddingCategory={setAddingCategory}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
            />
        </div>

        <div className="min-w-[300px] flex flex-col gap-3">
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
        </div>

        <div className="min-w-[300px] flex flex-col gap-3">
            <CommentFilter commentFilter={commentFilter} setCommentFilter={setCommentFilter}/>
        </div>
    </div>
    );
}