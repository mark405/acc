"use client";

import React, { useEffect, useRef, useState } from "react";
import { UserResponse } from "@/app/types";
import { instance } from "@/app/api/instance";

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (text: string, type: "TECH_GOAL" | "ADVERTISER_REQUEST" | "OFFERS_REQUEST", assignedTo: number[], files: File[]) => void;
}

export const CreateTicketModal = ({ isOpen, onClose, onCreate }: CreateTicketModalProps) => {
    const [text, setText] = useState("");
    const [type, setType] = useState<"TECH_GOAL" | "ADVERTISER_REQUEST" | "OFFERS_REQUEST">("TECH_GOAL");
    const [assignedTo, setAssignedTo] = useState<number[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUsers = async (roleFilter: string) => {
        try {
            const response = await instance.get("/users", { params: { role: roleFilter } });
            setUsers(response.data.content);
        } catch (e) {
            console.error("Error fetching users", e);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        if (type === "TECH_GOAL") {
            const fetchTechManagers = async () => {
                try {
                    const res = await instance.get("/users", { params: { role: "TECH_MANAGER" } });
                    setUsers(res.data.content);
                    setAssignedTo(res.data.content.map((u: UserResponse) => u.id));
                } catch (err) {
                    console.error("Failed to fetch TECH_MANAGER", err);
                }
            };
            fetchTechManagers();
        } else {
            // Для ADVERTISER_REQUEST загружаем OFFERS_MANAGER для выбора
            fetchUsers("OFFERS_MANAGER");
            setAssignedTo([]); // сброс выбранных пользователей
        }
    }, [isOpen, type]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleCreate = () => {
        onCreate(text, type, assignedTo, files);
        setText("");
        setType("TECH_GOAL");
        setAssignedTo([]);
        setFiles([]);
        setDropdownOpen(false);
    };

    const toggleUser = (id: number) => {
        setAssignedTo(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 pointer-events-auto">
            <div className="bg-gray-900 text-white rounded-2xl shadow-xl p-6 w-full max-w-2xl pointer-events-auto">

                {/* Заголовок */}
                <h2 className="text-2xl font-bold mb-6 text-center border-b border-gray-700 pb-3">
                    Створити Тікет
                </h2>

                {/* Тело формы */}
                <div className="flex flex-col gap-4">

                    {/* Текст тикета */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Текст</label>
                        <textarea
                            placeholder="Опис"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full resize-none h-48 p-3 rounded-lg border border-gray-700 bg-gray-800 focus:ring-2 focus:ring-purple-900 outline-none placeholder-gray-400 text-sm transition"
                        />
                    </div>

                    {/* Тип тикета */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Тип</label>
                        <select
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as "TECH_GOAL" | "ADVERTISER_REQUEST" | "OFFERS_REQUEST")
                            }
                            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:ring-2 focus:ring-purple-900  outline-none"
                        >
                            <option value="TECH_GOAL">Tech Goal</option>
                            <option value="ADVERTISER_REQUEST">Запити рекламодавцям</option>
                            <option value="OFFERS_REQUEST">Запити на офери</option>
                        </select>
                    </div>

                    {/* Назначение */}
                    {type === "ADVERTISER_REQUEST" || type === "OFFERS_REQUEST" ? (
                        <div className="relative flex flex-col gap-1">
                            <label className="text-sm font-medium">Призначено:</label>
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-left hover:bg-gray-700 flex justify-between items-center text-sm transition"
                            >
                                {assignedTo.length === 0
                                    ? "Кому ▾"
                                    : assignedTo
                                        .map((id) => users.find((u) => u.id === id)?.username)
                                        .join(", ")}
                                <span className="ml-2 text-gray-400">▾</span>
                            </button>

                            {dropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-full mt-1 w-full max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
                                >
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`px-3 py-2 cursor-pointer hover:bg-gray-700 flex justify-between items-center text-sm rounded
                      ${
                                                assignedTo.includes(user.id)
                                                    ? "bg-purple-950"
                                                    : ""
                                            }`}
                                            onClick={() => toggleUser(user.id)}
                                        >
                                            <span>{user.username}</span>
                                            {assignedTo.includes(user.id) && (
                                                <span className="focus:ring-purple-900  font-bold">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400">
                            Призначено:{" "}
                            {users
                                .filter((u) => assignedTo.includes(u.id))
                                .map((u) => u.username)
                                .join(", ")}
                        </div>
                    )}

                    {/* Файлы */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Додати файли</label>
                        <button
                            type="button"
                            className="w-full p-2 text-left border border-gray-700 rounded-lg bg-gray-800 text-sm text-gray-200 hover:border-purple-900  hover:bg-gray-700 transition flex justify-between items-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {files.length === 0
                                ? "Виберіть файли..."
                                : files.map((f) => f.name).join(", ")}
                            <span className="text-gray-400 ml-2">📎</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                setFiles((prev) => [...prev, ...selectedFiles]);
                            }}
                        />
                    </div>

                    {/* Показ выбранных файлов */}
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {files.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
                                >
                                    {f.name}
                                    <button
                                        onClick={() =>
                                            setFiles((prev) => prev.filter((_, idx) => idx !== i))
                                        }
                                        className="text-red-400 hover:text-red-600 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Кнопки */}
                <div className="mt-6 flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                        onClick={onClose}
                    >
                        Скасувати
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 text-white transition"
                        onClick={handleCreate}
                    >
                        Створити
                    </button>
                </div>
            </div>
        </div>
    );
};