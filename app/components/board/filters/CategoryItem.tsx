"use client";

import {Check, Edit2, Trash2, X} from "lucide-react";

interface CategoryItemProps {
    category: { id: number; name: string };
    selected: boolean;
    renamingCategory: { id: number; name: string } | null;
    setRenamingCategory: (val: { id: number; name: string } | null) => void;
    toggleCategoryFilter: (id: number) => void;
    renameCategory: (id: number, name: string) => void;
    deleteCategory: (id: number) => void;
}

export default function CategoryItem({
                                         category,
                                         selected,
                                         renamingCategory,
                                         setRenamingCategory,
                                         toggleCategoryFilter,
                                         renameCategory,
                                         deleteCategory,
                                     }: Readonly<CategoryItemProps>) {
    if (renamingCategory?.id === category.id) {
        return (
            <div className="flex items-center gap-2 mt-1">

                <input
                    autoFocus
                    value={renamingCategory.name}
                    onChange={(e) =>
                        setRenamingCategory(
                            renamingCategory ? {...renamingCategory, name: e.target.value} : null
                        )
                    }
                    className="w-[80%] ml-1 my-1 px-1 py-1 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button

                    onClick={(e) => {
                        const trimmed = renamingCategory.name.trim();
                        if (trimmed) renameCategory(category.id, trimmed);
                        else setRenamingCategory(null);

                    }}
                    className=" transition cursor-pointer text-indigo-300"
                >
                    <Check size={20}/>
                </button>
                <button
                    onClick={() => {
                        setRenamingCategory(null);
                    }}
                    className="transition cursor-pointer text-red-400 hover:text-red-500"
                >
                    <X size={20}/>
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex items-center gap-2 mt-1 пкщгз">
            <button
                type="button"
                onClick={() => toggleCategoryFilter(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                    selected ? "bg-indigo-500 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                }`}
            >
                {category.name}
            </button>
            <button

                onClick={() =>
                    setRenamingCategory({id: category.id, name: category.name})
                }
                className=" transition cursor-pointer text-indigo-300"
            >
                <Edit2 size={18}/>
            </button>
            <button
                onClick={() => deleteCategory(category.id)}
                className="transition cursor-pointer text-red-400 hover:text-red-500"
            >
                <Trash2 size={18}/>
            </button>
        </div>
    );
}
