"use client";

import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const {user, setUser, isAdmin} = useAuth();
    const userInitial = user?.username.at(0)?.toUpperCase();
    const router = useRouter();

    const handleLogout = async () => {
        const res = await instance.post("/auth/logout");

        if (res.status == HttpStatusCode.NoContent) {
            setUser(null);
            router.push("/login");
        }
    };

    return (
        <nav className="bg-gray-900 h-30 shadow-lg flex items-center px-6 relative">
            {/* Left side */}
            <div className="flex-1"></div>
            {!isAdmin && (
                <Link
                    href="/"
                    className="absolute left-6 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 hover:bg-gray-600 transition"
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
            )}
            {/* Right side with links and profile */}
            <div className="flex items-center space-x-8 relative">
                {isAdmin && (
                    <>
                        <Link
                            href="/"
                            className="text-white text-lg font-medium hover:text-gray-300 transition"
                        >
                            Статистика
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
                    </>
                )}

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
                        <div
                            className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 text-gray-800 z-50">
                            <Link
                                href="/settings"
                                className="block px-4 py-2 text-lg hover:bg-gray-100 transition"
                                onClick={() => setMenuOpen(false)}
                            >
                                Налаштування
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block px-4 py-2 text-lg hover:bg-gray-100 w-full text-left transition"
                            >
                                Вийти
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
