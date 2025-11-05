"use client";

import {useEffect, useRef} from "react";
import CategoryFilters from "@/app/components/filters/CategoryFilters";
import {CategoryResponse} from "@/app/types";
import DateFilters from "@/app/components/filters/DateFilters";
import CommentFilter from "@/app/components/filters/CommentFilters";

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
        <div className="w-64 flex-shrink-0 space-y-4 bg-gray-900 p-4 rounded-lg shadow-lg">
            {/* Comment Filter */}
            <CommentFilter commentFilter={commentFilter} setCommentFilter={setCommentFilter}/>

            {/* Date Filters */}
            <DateFilters
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
            />

            {/* Categories */}
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
    );
}