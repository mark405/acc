"use client";

import React, { useEffect, useRef, useState } from "react";
import { UserResponse } from "@/app/types";
import { instance } from "@/app/api/instance";

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (text: string, type: "TECH_GOAL" | "ADVERTISER_REQUEST", assignedTo: number[], files: File[]) => void;
}

export const CreateTicketModal = ({ isOpen, onClose, onCreate }: CreateTicketModalProps) => {
    const [text, setText] = useState("");
    const [type, setType] = useState<"TECH_GOAL" | "ADVERTISER_REQUEST">("TECH_GOAL");
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

    // Обновляем список пользователей при открытии модалки и смене type
    useEffect(() => {
        if (isOpen) {
            const role = type === "TECH_GOAL" ? "TECH_MANAGER" : "OFFERS_MANAGER";
            fetchUsers(role);
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
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gray-800 text-white rounded shadow-lg p-6 w-[768px] pointer-events-auto">
                <h2 className="text-lg font-bold mb-4">Створити Тікет</h2>

                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-lg font-medium">Текст:</label>
                    <textarea
                        placeholder="Опис"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="border border-gray-600 rounded px-2 py-2 bg-gray-700 text-white resize-none h-64"
                    />

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as "TECH_GOAL" | "ADVERTISER_REQUEST")}
                        className="border border-gray-600 rounded px-2 py-1 mb-3 bg-gray-700 text-white"
                    >
                        <option value="TECH_GOAL">Tech Goal</option>
                        <option value="ADVERTISER_REQUEST">Запит на рекламу</option>
                    </select>

                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="w-full text-left px-2 py-1 border border-gray-600 rounded bg-gray-700 cursor-pointer"
                        >
                            {assignedTo.length === 0
                                ? "Кому ▾"
                                : assignedTo.map(id => users.find(u => u.id === id)?.username).join(", ")}
                        </button>

                        {dropdownOpen && (
                            <div
                                ref={dropdownRef}
                                className="absolute mt-1 w-full max-h-64 overflow-auto bg-gray-700 border border-gray-600 rounded shadow-lg z-50"
                            >
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        className={`px-2 py-1 cursor-pointer hover:bg-gray-600 flex justify-between items-center
                                        ${assignedTo.includes(user.id) ? "bg-gray-600" : ""}`}
                                        onClick={() => toggleUser(user.id)}
                                    >
                                        <span>{user.username}</span>
                                        {assignedTo.includes(user.id) && (
                                            <span className="text-green-400 font-bold">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <label className="text-sm mb-1 block">Додати файли:</label>
                        <div className="relative">
                            <button
                                type="button"
                                className="w-full text-left px-2 py-2 border border-gray-500 rounded bg-gray-700 text-sm text-gray-200 hover:border-blue-400"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {files.length === 0
                                    ? "Виберіть файли..."
                                    : files.map(f => f.name).join(", ")}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    const selectedFiles = Array.from(e.target.files || []);
                                    setFiles(prev => [...prev, ...selectedFiles]);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Скасувати
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={handleCreate}
                    >
                        Створити
                    </button>
                </div>
            </div>
        </div>
    );
};