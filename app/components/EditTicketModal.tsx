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
    const [status, setStatus] = useState(ticket.status);
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
            formData.append("status", status);
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
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gray-800 text-white rounded shadow-lg p-6 w-[768px] pointer-events-auto">
                <h2 className="text-lg font-bold mb-4">Редагувати тікет #{ticket.id}</h2>

                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="border border-gray-600 rounded px-2 py-2 bg-gray-700 text-white resize-none h-64 w-full mb-3"
                />

                <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="border border-gray-600 rounded px-2 py-1 mb-3 bg-gray-700 text-white w-full"
                >
                    <option value="OPENED">Відкрито</option>
                    <option value="CLOSED">Закрито</option>
                </select>

                <div className="relative mb-3">
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
                            className="absolute mt-1 w-full max-h-48 overflow-auto bg-gray-700 border border-gray-600 rounded shadow-lg z-50"
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

                <div className="mb-3">
                    <label className="block text-sm mb-1">Додати файли:</label>
                    <button
                        type="button"
                        className="w-full text-left px-2 py-2 border border-gray-500 rounded bg-gray-700 text-sm text-gray-200 hover:border-blue-400"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {filesToAdd.length === 0 ? "Виберіть файли..." : filesToAdd.map(f => f.name).join(", ")}
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
                </div>

                {ticket.files.length > 0 && (
                    <div className="mb-3">
                        <span>Видалити файли:</span>
                        {ticket.files.map(f => (
                            <label key={f.id} className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    onChange={e =>
                                        e.target.checked
                                            ? setFilesToDelete(prev => [...prev, f.id])
                                            : setFilesToDelete(prev => prev.filter(id => id !== f.id))
                                    }
                                />
                                {f.file_name}
                            </label>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-4">
                    <button
                        className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Скасувати
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={handleSubmit}
                    >
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
};