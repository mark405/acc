"use client";

import React, {SetStateAction, useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";
import {RefreshCw, Trash2} from "lucide-react";
import {DeleteModal} from "@/app/components/DeleteModal";
import {ChangePasswordModal} from "@/app/components/ChangePasswordModal";
import {UserResponse} from "@/app/types";

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
    const {isLoggedIn} = useAuth();
    const [userId, setUserId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);


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

            const response = await instance.get("/users", {params});

            setUsers(response.data.content);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        setPage(0);
    }, [username, role]);

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

    const handleDeleteClick = (id: number) => {
        setUserId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (userId === null) return;

        try {
            const response = await instance.delete(`/users/delete/${userId}`);
            if (response.status === HttpStatusCode.NoContent) {
                fetchUsers();
            }
        } catch (err) {
            console.error("Failed to delete user", err);
        } finally {
            setIsDeleteModalOpen(false);
            setUserId(null);
        }
    }

    const handleChangePasswordClick = (id: number) => {
        setUserId(id);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordChange = async (password: string, confirmPassword: string) => {
        if (userId === null) return;

        try {
            const response = await instance.post(`/users/change-password/${userId}`, {
                password,
                confirm_password: confirmPassword
            });
            if (response.status === HttpStatusCode.NoContent) {
                fetchUsers();
            }
        } catch (err) {
            console.error("Failed to change password", err);
        } finally {
            setIsPasswordModalOpen(false);
            setUserId(null);
        }
    }

    return (
        <>
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-center">Облікові записи</h1>

                {/* Filters */}
                <div className="flex items-center space-x-4 mb-4 justify-center">
                    <input
                        type="text"
                        placeholder="Шукати по логіну"
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                        className="border rounded px-2 py-1"
                        autoComplete="off"
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
                            <tr key={u.id} className="border-t border-gray-300 ">
                                <td className="px-4 py-2 text-left">{u.username}</td>
                                <td className="px-4 py-2 text-left">{u.role}</td>
                                <td className="px-4 py-2 text-left">
                                    {new Date(u.created_at).toLocaleString("en-GB", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                        timeZone: "Europe/Kiev",
                                    })}
                                </td>
                                <td className="px-4 py-2 text-left">
                                    {new Date(u.modified_at).toLocaleString("en-GB", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                        timeZone: "Europe/Kiev",
                                    })}
                                </td>
                                {u.role === "USER" && (
                                    <td className="px-4 py-2 text-left flex gap-2">
                                        <RefreshCw
                                            size={18}
                                            className="text-blue-600 hover:text-blue-400 cursor-pointer transition"
                                            onClick={() => handleChangePasswordClick(u.id)}
                                        />
                                        <Trash2
                                            size={18}
                                            className="text-red-600 hover:text-red-400 cursor-pointer transition"
                                            onClick={() => handleDeleteClick(u.id)}
                                        />
                                    </td>
                                )}
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
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Ви точно хочете видалити цей обліковий запис?"
            />
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordChange}
                title="Змінити пароль"
            />
        </>
    );
}
