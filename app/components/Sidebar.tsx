"use client";

import { useState } from "react";
import Link from "next/link";

const sampleNames = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Hannah",
];

export default function Sidebar() {
    const [search, setSearch] = useState("");
    const [collapsed, setCollapsed] = useState(false);

    const filteredNames = sampleNames.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    const sidebarWidth = collapsed ? 80 : 288; // px

    return (
        <div className="relative">
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full bg-gray-800 text-white shadow-xl z-50 transition-all duration-300 flex flex-col`}
                style={{ width: `${sidebarWidth}px` }}
            >
                {/* Top: Home Icon + Title / Collapse */}
                <div className="flex items-center justify-between px-4 md:px-6 py-6 relative">
                    <div
                        className={`flex items-center ${
                            collapsed ? "justify-center w-full" : "space-x-3"
                        }`}
                    >
                        {/* Home icon */}
                        <Link
                            href="/"
                            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                        >
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 21V12h6v9"
                                />
                            </svg>
                        </Link>

                        {/* Title */}
                        {!collapsed && (
                            <Link
                                href="/"
                                className="text-2xl md:text-3xl font-extrabold hover:text-gray-300 transition"
                            >
                                Назва
                            </Link>
                        )}
                    </div>

                    {/* Collapse arrow */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`text-white text-2xl font-bold absolute right-0 top-1/2 transform -translate-y-1/2`}
                    >
                        {collapsed ? "\u2192" : "\u2190"}
                    </button>
                </div>

                {/* Divider */}
                {!collapsed && <hr className="border-gray-600 " />}

                {/* Search Input */}
                {!collapsed && (
                    <div className="px-6 py-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* List of names */}
                {!collapsed && (
                    <div className="mt-4 flex-1 overflow-y-auto">
                        {filteredNames.map((name, index) => (
                            <Link
                                key={index}
                                href={`/employee/${index + 1}`}
                                className="block px-6 py-3 hover:bg-gray-700 cursor-pointer transition text-lg"
                            >
                                {name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
