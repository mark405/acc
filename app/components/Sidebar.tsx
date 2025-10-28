"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpAZ, CalendarPlus,} from "lucide-react";
import {instance} from "@/app/api/instance";

interface EmployeeResponse {
    id: number;
    name: string;
    comment: string;
    rating: number;
}

export default function Sidebar() {
    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [search, setSearch] = useState("");
    const [collapsed, setCollapsed] = useState(true);
    const [sortField, setSortField] = useState<"alphabetic" | "created">("alphabetic");
    const [sortAsc, setSortAsc] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(25);

    const fetchEmployees = async () => {
        try {
            const sortByMap: Record<string, string> = {
                alphabetic: "name",
                created: "id",
            };

            const res = await instance.get("/employees", {
                params: {
                    nameOrComment: search || undefined,
                    sortBy: sortByMap[sortField],
                    direction: sortAsc ? "asc" : "desc",
                    page,
                    size,
                },
            });

            setEmployees(res.data.content); // assuming Page<EmployeeResponse>
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [search, sortAsc, page, sortField]);

    const sidebarWidth = collapsed ? 80 : 340;

    const getSortFieldIcon = () => {
        switch (sortField) {
            case "alphabetic":
                return <ArrowUpAZ size={18} />;
            case "created":
                return <CalendarPlus size={18} />;
        }
    };

    const sortFieldLabels: Record<string, string> = {
        alphabetic: "Алфавіт",
        created: "Створено",
    };

    return (
        <div className="relative">
            <div
                className={`fixed top-0 left-0 h-full bg-gray-800 text-white shadow-xl z-50 transition-all duration-300 flex flex-col`}
                style={{ width: `${sidebarWidth}px` }}
            >
                {/* Top: Home + Title */}
                <div className="flex items-center justify-between px-4 md:px-6 py-6 relative">
                    <div className={`flex items-center ${collapsed ? "justify-center w-full" : "space-x-3"}`}>
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
                            </svg>
                        </Link>

                        {!collapsed && (
                            <Link href="/" className="text-2xl md:text-3xl font-extrabold hover:text-gray-300 transition">
                                Traffgun
                            </Link>
                        )}
                    </div>
                </div>

                {!collapsed && <hr className="border-gray-600" />}

                {/* Search + Sort */}
                {!collapsed && (
                    <div className="px-6 py-4 flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Sort dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition flex items-center"
                            >
                                {getSortFieldIcon()}
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 mt-2 w-40 bg-gray-700 border border-gray-600 rounded shadow-lg z-50">
                                    {["alphabetic", "created"].map((field) => (
                                        <div
                                            key={field}
                                            onClick={() => {
                                                setSortField(field as typeof sortField);
                                                setDropdownOpen(false);
                                            }}
                                            className={`px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2 ${
                                                sortField === field ? "bg-gray-600" : ""
                                            }`}                                        >
                                            {field === "alphabetic" && <ArrowUpAZ size={22} />}
                                            {field === "created" && <CalendarPlus size={22} />}
                                            <span className="capitalize">{sortFieldLabels[field]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort order toggle */}
                        <button
                            onClick={() => setSortAsc(!sortAsc)}
                            className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition"
                        >
                            {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </button>
                    </div>
                )}

                {/* Employee list */}
                {!collapsed && (
                    <div className="mt-2 flex-1 overflow-y-auto sidebar-scroll">
                        {employees.map((employee) => (
                            <Link
                                key={employee.id}
                                href={`/employee/${employee.id}`}
                                className="block px-6 py-3 hover:bg-gray-700 cursor-pointer transition text-lg"
                            >
                                {employee.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Collapse/Expand arrow */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="fixed top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 ease-in-out z-50"
                style={{
                    left: collapsed ? `${sidebarWidth}px` : `${sidebarWidth - 16}px`,
                }}
            >
                {collapsed ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
            </button>
        </div>
    );
}
