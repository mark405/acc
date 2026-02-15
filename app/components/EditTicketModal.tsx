"use client";

import React, { useEffect, useRef, useState } from "react";
import { TicketResponse, UserResponse } from "@/app/types";
import { instance } from "@/app/api/instance";

interface EditTicketModalProps {
    isOpen: boolean;
    ticket: TicketResponse;
    onClose: () => void;
    onUpdate: () => void;
}

export const EditTicketModal = ({ isOpen, ticket, onClose, onUpdate }: EditTicketModalProps) => {
    const [text, setText] = useState(ticket.text);
    const [assignedTo, setAssignedTo] = useState<number[]>(ticket.assigned_to.map(u => u.id));
    const [users, setUsers] = useState<UserResponse[]>(ticket.assigned_to);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [filesToAdd, setFilesToAdd] = useState<File[]>([]);
    const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // Fetch all users when modal opens
        const role = ticket.type == 'ADVERTISER_REQUEST' ? 'OFFERS_MANAGER' : 'TECH_MANAGER';
        if (isOpen) {
            const fetchAllUsers = async () => {
                try {
                    const response = await instance.get("/users", { params: { role: role}});
                    setUsers(response.data.content);
                } catch (err) {
                    console.error("Error fetching users:", err);
                }
            };
            fetchAllUsers();
        }
    }, [isOpen]);

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

    const toggleUser = (id: number) => {
        setAssignedTo(prev => (prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]));
    };

    const handleSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append("text", text);
            formData.append("status", ticket.status);
            assignedTo.forEach(id => formData.append("assignedTo", id.toString()));
            filesToAdd.forEach(f => formData.append("filesToAdd", f));
            filesToDelete.forEach(id => formData.append("filesToDelete", id.toString()));

            await instance.put(`/tickets/update/${ticket.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            onUpdate();
            onClose();
        } catch (err) {
            console.error("Error updating ticket:", err);
            alert("Не вдалося оновити тікет");
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 pointer-events-auto">
            <div className="bg-gray-900 text-white rounded-2xl shadow-xl p-6 w-full max-w-2xl pointer-events-auto">

                {/* Заголовок */}
                <h2 className="text-2xl font-bold mb-6 text-center border-b border-gray-700 pb-3">
                    Редагувати тікет #{ticket.id}
                </h2>

                {/* Текст тикета */}
                <div className="mb-4 flex flex-col gap-1">
                    <label className="text-sm font-medium">Текст</label>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="w-full h-48 p-3 rounded-lg border border-gray-700 bg-gray-800 resize-none text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-900 outline-none transition"
                    />
                </div>

                {/* Призначення */}
                <div className="mb-4 relative flex flex-col gap-1">
                    <label className="text-sm font-medium">Призначення</label>
                    {ticket.type === "TECH_GOAL" ? (
                        <div className="px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-200 text-sm">
                            {users.map(u => u.username).join(", ")}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setDropdownOpen(prev => !prev)}
                                className="w-full text-left px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-sm transition"
                            >
                                {assignedTo.length === 0
                                    ? "Кому ▾"
                                    : assignedTo.map(id => users.find(u => u.id === id)?.username).join(", ")}
                                <span className="ml-2 text-gray-400">▾</span>
                            </button>

                            {dropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-full mt-1 w-full max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
                                >
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            className={`px-3 py-2 cursor-pointer hover:bg-gray-700 flex justify-between items-center rounded
                      ${assignedTo.includes(user.id) ? "bg-purple-900" : ""}`}
                                            onClick={() => toggleUser(user.id)}
                                        >
                                            <span>{user.username}</span>
                                            {assignedTo.includes(user.id) && (
                                                <span className="text-purple-900 font-bold">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Файлы */}
                <div className="mb-4 flex flex-col gap-2">
                    <label className="text-sm font-medium">Додати файли</label>
                    <button
                        type="button"
                        className="w-full text-left px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-sm transition"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {filesToAdd.length === 0
                            ? "Виберіть файли..."
                            : filesToAdd.map(f => f.name).join(", ")}
                        <span className="ml-2 text-gray-400">📎</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => {
                            const selectedFiles = Array.from(e.target.files || []);
                            setFilesToAdd(prev => [...prev, ...selectedFiles]);
                        }}
                    />

                    {/* Файлы для удаления */}
                    {ticket.files.length > 0 && (
                        <div className="flex flex-col gap-1 mt-2 text-sm">
                            <span>Видалити файли:</span>
                            {ticket.files.map(f => (
                                <label key={f.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        onChange={e =>
                                            e.target.checked
                                                ? setFilesToDelete(prev => [...prev, f.id])
                                                : setFilesToDelete(prev => prev.filter(id => id !== f.id))
                                        }
                                        className="accent-purple-900"
                                    />
                                    {f.file_name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Кнопки */}
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition shadow-sm"
                        onClick={onClose}
                    >
                        Скасувати
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                        onClick={handleSubmit}
                    >
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
};