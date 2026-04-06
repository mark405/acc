"use client";

import { useRef, useState } from "react";
import { CategoryResponse } from "@/app/types";
import { Check, Plus, X, ChevronDown } from "lucide-react";
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

    const [open, setOpen] = useState(false);
    const categoryInputRef = useRef<HTMLInputElement>(null);

    const toggleCategoryFilter = (id: number) => {
        const newFilter = categoryFilter.includes(id)
            ? categoryFilter.filter(cid => cid !== id)
            : [...categoryFilter, id];
        setCategoryFilter(newFilter);
    };

    const selectedNames = categories
        .filter(c => categoryFilter.includes(c.id))
        .map(c => c.name);

    return (
        <div className="bg-gray-800/40  rounded-lg min-w-[220px] relative">

            {/* Dropdown header */}
            <div
                onClick={() => setOpen(!open)}
                className="flex justify-between items-center cursor-pointer px-2 py-2 rounded-md bg-gray-800 hover:bg-gray-700"
            >
                <span className="text-sm text-gray-200 truncate">
                    {selectedNames.length > 0
                        ? selectedNames.join(", ")
                        : "Оберіть категорії"}
                </span>

                <ChevronDown
                    size={18}
                    className={`text-white transition-transform ${open ? "rotate-180" : ""}`}
                />
            </div>

            {/* Dropdown content */}
            {open && (
                <div className="absolute z-50 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">

                    {/* Add category */}
                    <div className="flex items-center gap-2 mb-2">
                        {addingCategory ? (
                            <>
                                <input
                                    ref={categoryInputRef}
                                    autoFocus
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Нова категорія…"
                                    className="flex-1 px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />

                                <button
                                    onClick={() => {
                                        const trimmed = newCategoryName.trim();
                                        if (trimmed) {
                                            const exists = categories.some(
                                                (c) => c.name.toLowerCase() === trimmed.toLowerCase()
                                            );

                                            if (!exists) {
                                                submitNewCategory(trimmed);
                                            }
                                        } else {
                                            setAddingCategory(false);
                                            setNewCategoryName("");
                                        }
                                    }}
                                    className="text-indigo-300 hover:text-indigo-200"
                                >
                                    <Check size={18} />
                                </button>

                                <button
                                    onClick={() => {
                                        setNewCategoryName("");
                                        setAddingCategory(false);
                                    }}
                                    className="text-red-400 hover:text-red-500"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setAddingCategory(true)}
                                className="flex items-center gap-1 text-sm text-gray-300 hover:text-indigo-400"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    {/* Categories list */}
                    <div className="flex flex-col max-h-64 overflow-y-auto sidebar-scroll space-y-1">
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
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}