"use client";

import Link from "next/link";
import {useState} from "react";
import {useParams, usePathname, useRouter} from "next/navigation";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";
import {User} from "lucide-react";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const {user, setUser, isAdmin} = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isProjectPage = pathname == "/";
    const handleLogout = async () => {
        const res = await instance.post("/auth/logout");

        if (res.status == HttpStatusCode.NoContent) {
            setUser(null);
            router.push("/login");
        }
    };
    const projectId = useParams().projectId;

    return (
        <nav className="bg-gray-900 h-30 shadow-lg flex items-center px-6 relative">
            {/* Left side */}
            <div className="flex-1"></div>
            <>
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
            </>
            {/* Right side with links and profile */}
            <div className="flex items-center space-x-8 relative">
                {(!isAdmin && !isProjectPage) && (
                    <>
                        <Link
                            href={`/projects/${projectId}/`}
                            className="text-white text-lg font-medium hover:text-gray-300 transition"
                        >
                            Зарплата
                        </Link>
                        <Link
                            href={`/projects/${projectId}/tickets`}
                            className="text-white text-lg font-medium hover:text-gray-300 transition"
                        >
                            Тікети
                        </Link>
                    </>
                )}
                {(isAdmin && isProjectPage) && (
                    <Link
                        href={`/projects/${projectId}/tickets`}
                        className="text-white text-lg font-medium hover:text-gray-300 transition"
                    >
                        Облікові записи
                    </Link>
                )}
                {isAdmin && (
                    <>
                        {[
                            { href: `/projects/${projectId}/`, label: "Статистика", hideOnProjectPage: true },
                            { href: `/projects/${projectId}/tickets`, label: "Тікети", hideOnProjectPage: true },
                            { href: `/projects/${projectId}/history`, label: "Історія", hideOnProjectPage: true },
                        ]
                            .filter(link => !link.hideOnProjectPage || !isProjectPage)
                            .map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-white text-lg font-medium hover:text-gray-300 transition"
                                >
                                    {link.label}
                                </Link>
                            ))}
                    </>
                )}

                {/* Profile */}
                <div className="relative h-full">
                    <div
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-800 transition cursor-pointer h-full"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white">
                            <User className="w-8 h-8"/>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col leading-tight">
      <span className="text-lg font-semibold text-white">
        {user?.username}
      </span>
                            <span className="text-sm text-gray-400">
        {user?.role} • ID {user?.id}
      </span>
                        </div>
                    </div>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg py-3 text-white z-50">
                            {isProjectPage && (
                                <Link
                                    href="/settings"
                                    className="block px-4 py-3 text-base hover:bg-gray-700 transition"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Налаштування
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-3 text-base hover:bg-gray-700 transition"
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
