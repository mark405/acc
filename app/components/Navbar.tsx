"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const userInitial = "M"; // later replace dynamically

    return (
        <nav className="bg-gray-900 h-30 shadow-lg flex items-center px-6 relative">
            {/* Left side */}
            <div className="flex-1"></div>

            {/* Right side with links and profile */}
            <div className="flex items-center space-x-8 relative">
                {/* Navigation titles */}
                <Link
                    href="/"
                    className="text-white text-lg font-medium hover:text-gray-300 transition"
                >
                    Головна
                </Link>
                <Link
                    href="/accounts"
                    className="text-white text-lg font-medium hover:text-gray-300 transition"
                >
                    Облікові записи
                </Link>
                <Link
                    href="/history"
                    className="text-white text-lg font-medium hover:text-gray-300 transition"
                >
                    Історія
                </Link>

                {/* Profile circle */}
                <div className="relative">
                    <div
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                    >
                        {userInitial}
                    </div>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 text-gray-800 z-50">
                            <Link
                                href="/settings"
                                className="block px-4 py-2 text-lg hover:bg-gray-100 transition"
                                onClick={() => setMenuOpen(false)}
                            >
                                Налаштування
                            </Link>
                            <Link
                                href="/logout"
                                className="block px-4 py-2 text-lg hover:bg-gray-100 transition"
                                onClick={() => setMenuOpen(false)}
                            >
                                Вийти
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
