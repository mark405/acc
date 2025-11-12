"use client";

import {useEffect, useState} from "react";
import { createPortal } from "react-dom";

interface CategoryItemProps {
    category: { id: number; name: string };
    selected: boolean;
    renamingCategory: { id: number; name: string } | null;
    setRenamingCategory: (val: { id: number; name: string } | null) => void;
    toggleCategoryFilter: (id: number) => void;
    renameCategory: (id: number, name: string) => void;
    deleteCategory: (id: number) => void;
    contextMenu: { categoryId: number; position: "top" | "bottom"; rect: DOMRect } | null;
    setContextMenu: (val: { categoryId: number; position: "top" | "bottom"; rect: DOMRect } | null) => void;
}

export default function CategoryItem({
                                         category,
                                         selected,
                                         renamingCategory,
                                         setRenamingCategory,
                                         toggleCategoryFilter,
                                         renameCategory,
                                         deleteCategory,
                                         contextMenu,
                                         setContextMenu,
                                     }: Readonly<CategoryItemProps>) {

    useEffect(() => {
        const close = () => setContextMenu(null);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const menuHeight = 80;
        const spaceBelow = window.innerHeight - rect.bottom;

        setContextMenu({
            categoryId: category.id,
            position: spaceBelow < menuHeight ? "top" : "bottom",
            rect,
        });
    };

    if (renamingCategory?.id === category.id) {
        return (
            <input
                autoFocus
                value={renamingCategory.name}
                onChange={(e) =>
                    setRenamingCategory(
                        renamingCategory ? {...renamingCategory, name: e.target.value} : null
                    )
                }
                onKeyDown={(e) => {
                    const trimmed = renamingCategory.name.trim();
                    if (e.key === "Enter" && trimmed) renameCategory(category.id, trimmed);
                    else if (e.key === "Escape") setRenamingCategory(null);

                }}
                className="w-[97%] ml-1 my-1 px-1 py-1 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => toggleCategoryFilter(category.id)}
                onDoubleClick={() => setRenamingCategory({id: category.id, name: category.name})}
                onContextMenu={handleContextMenu}
                className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                    selected ? "bg-indigo-500 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                }`}
            >
                {category.name}
            </button>

            {/*{contextMenu && (*/}
            {/*    <div*/}
            {/*        className={`absolute right-0 bg-gray-700 text-white rounded shadow-md w-36 z-50 ${*/}
            {/*            contextMenu.position === "top" ? "bottom-full mb-1" : "top-full mt-1"*/}
            {/*        }`}*/}
            {/*    >*/}
            {/*        <button*/}
            {/*            onClick={() => setRenamingCategory({id: category.id, name: category.name})}*/}
            {/*            className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-800"*/}
            {/*        >*/}
            {/*            Редагувати*/}
            {/*        </button>*/}
            {/*        <button*/}
            {/*            onClick={() => deleteCategory(category.id)}*/}
            {/*            className="block w-full text-left px-2 py-1 text-sm hover:bg-red-600"*/}
            {/*        >*/}
            {/*            Видалити*/}
            {/*        </button>*/}
            {/*    </div>*/}
            {/*)}*/}
            {contextMenu?.categoryId === category.id &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            top:
                                contextMenu.position === "bottom"
                                    ? contextMenu.rect.bottom
                                    : contextMenu.rect.top - 80,
                            left: contextMenu.rect.right - 144,
                            width: 144, // matches w-36
                            zIndex: 50,
                        }}
                        className="bg-gray-700 text-white rounded shadow-md"
                    >
                        <button
                            onClick={() =>
                                setRenamingCategory({ id: category.id, name: category.name })
                            }
                            className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-800"
                        >
                            Редагувати
                        </button>
                        <button
                            onClick={() => deleteCategory(category.id)}
                            className="block w-full text-left px-2 py-1 text-sm hover:bg-red-600"
                        >
                            Видалити
                        </button>
                    </div>,
                    document.body
                )}
        </div>
    );
}
