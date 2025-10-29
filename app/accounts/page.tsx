"use client";

import {SetStateAction, useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";
import {useRouter} from "next/navigation";
import {RefreshCw, Trash2} from "lucide-react";

interface UserResponse {
    id: number;
    username: string;
    role: string;
    created_at: number;
    modified_at: number;
}

const roles = ["USER", "ADMIN"];

export default function AccountsPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [username, setUserName] = useState("");
    const [role, setRole] = useState("");
    const [sortBy, setSortBy] = useState("username");
    const [direction, setDirection] = useState("asc");
    const [page, setPage] = useState(0);
    const [size] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const { isLoggedIn, checkAuth } = useAuth();
    const router = useRouter();

    const fetchUsers = async () => {
        try {
            const params = {
                username: username || undefined,
                role: role || undefined,
                sort_by: sortBy,
                direction,
                page,
                size,
            };

            let response = await instance.get("/users", {params});

            if (response.status === HttpStatusCode.Forbidden) {
                debugger;
                await checkAuth();
                if (!isLoggedIn) {
                    router.replace("/login");
                }
                response = await instance.get("/users", { params });
            }

            setUsers(response.data.content);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error("Error fetching users:", error);

        }
    };

    useEffect(() => {
        fetchUsers();
    }, [username, role, sortBy, direction, page, isLoggedIn]);

    const handleSort = (field: SetStateAction<string>) => {
        if (sortBy === field) {
            setDirection(direction === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setDirection("asc");
        }
    };

    const handleDelete = async (id: number) => {

    };

    const handleResetPassword = async (id: number) => {

    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">Облікові записи</h1>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-4 justify-center">
                <input
                    type="text"
                    placeholder="Шукати по логіну"
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Усі ролі</option>
                    {roles.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse border border-gray-300">
                    <thead>
                    <tr className="bg-gray-800 text-white">
                        <th className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("username")}>Логін {sortBy === "username" && (direction === "asc" ? "↑" : "↓")}</th>
                        <th className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("role")}>Роль {sortBy === "role" && (direction === "asc" ? "↑" : "↓")}</th>
                        <th className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("createdAt")}>Створення {sortBy === "createdAt" && (direction === "asc" ? "↑" : "↓")}</th>
                        <th className="w-1/4 px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("modifiedAt")}>Редагування {sortBy === "modifiedAt" && (direction === "asc" ? "↑" : "↓")}</th>
                        <th className="w-1/4 px-4 py-2 text-left cursor-pointer">Дії</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u) => (
                        <tr key={u.id} className="border-t border-gray-300">
                            <td className="px-4 py-2 text-left">{u.username}</td>
                            <td className="px-4 py-2 text-left">{u.role}</td>
                            <td className="px-4 py-2 text-left">{new Date(u.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2 text-left">{new Date(u.modified_at).toLocaleString()}</td>
                            <td className="px-4 py-2 text-left flex gap-2">
                                <RefreshCw
                                    size={18}
                                    className="text-blue-600 hover:text-blue-400 cursor-pointer transition"
                                    onClick={() => handleResetPassword(u.id)}
                                />
                                <Trash2
                                    size={18}
                                    className="text-red-600 hover:text-red-400 cursor-pointer transition"
                                    onClick={() => handleDelete(u.id)}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex space-x-2 justify-center">
                {page > 0 && (
                <button
                    onClick={() => setPage((prev) => prev - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                >
                    Минула
                </button>)}
                <span className="px-3 py-1">Сторінка {users.length == 0 ? 0 : page + 1} з {totalPages}</span>
                {page + 1 < totalPages && (
                <button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                >
                    Наступна
                </button>)}
            </div>
        </div>
    );

}
