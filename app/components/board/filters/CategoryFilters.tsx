"use client";

import {useRef, useState} from "react";
import {CategoryResponse} from "@/app/types";
import {Plus} from "lucide-react";
import CategoryItem from "@/app/components/board/filters/CategoryItem";

interface CategoryFiltersProps {
    categories: CategoryResponse[];
    categoryFilter: number[];
    setCategoryFilter: (ids: number[]) => void;
    renamingCategory: { id: number; name: string } | null;
    setRenamingCategory: (val: { id: number; name: string } | null) => void;
    submitNewCategory: (name: string) => void;
    deleteCategory: (id: number) => void;
    renameCategory: (id: number, name: string) => void;
    addingCategory: boolean;
    setAddingCategory: (val: boolean) => void;
    newCategoryName: string;
    setNewCategoryName: (val: string) => void;
}

export default function CategoryFilters({
                                            categories,
                                            categoryFilter,
                                            setCategoryFilter,
                                            renamingCategory,
                                            setRenamingCategory,
                                            submitNewCategory,
                                            deleteCategory,
                                            renameCategory,
                                            addingCategory,
                                            setAddingCategory,
                                            newCategoryName,
                                            setNewCategoryName,
                                        }: Readonly<CategoryFiltersProps>) {
    const categoryInputRef = useRef<HTMLInputElement>(null);

    const toggleCategoryFilter = (id: number) => {
        const newFilter = categoryFilter.includes(id)
            ? categoryFilter.filter(cid => cid !== id)
            : [...categoryFilter, id];
        setCategoryFilter(newFilter);
    };

    const [contextMenu, setContextMenu] = useState<{
        categoryId: number;
        position: "top" | "bottom";
        rect: DOMRect;
    } | null>(null);

    return (
        <div className="flex-1 flex flex-col mt-4 overflow-y-hidden">
            <div className="flex justify-between items-center mb-3">
                <span className="text-white text-sm font-semibold">Категорії</span>
                <Plus
                    size={20}
                    className="text-gray-400 hover:text-indigo-400 cursor-pointer"
                    onClick={() => setAddingCategory(true)}
                />
            </div>
            <div className="flex flex-col space-y-1 max-h-96 overflow-y-auto sidebar-scroll">
                {addingCategory && (
                    <input
                        ref={categoryInputRef}
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                            const trimmed = newCategoryName.trim();
                            if (e.key === "Enter" && trimmed) {
                                const exists = categories.some(
                                    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
                                );

                                if (!exists) {
                                    submitNewCategory(trimmed);
                                }
                            } else if (e.key === "Escape") {
                                setAddingCategory(false);
                                setNewCategoryName("");
                            }
                        }}
                        placeholder="Нова категорія…"
                        className="w-[97%] ml-1 my-1 px-1 py-1 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                )}

                {categories.map((c) => (
                    <CategoryItem
                        key={c.id}
                        category={c}
                        selected={categoryFilter.includes(c.id)}
                        renamingCategory={renamingCategory}
                        setRenamingCategory={setRenamingCategory}
                        toggleCategoryFilter={toggleCategoryFilter}
                        renameCategory={renameCategory}
                        deleteCategory={deleteCategory}
                        contextMenu={contextMenu}
                        setContextMenu={setContextMenu}
                    />
                ))}
            </div>
        </div>
    );
}
