"use client";

import React, {useEffect, useRef, useState} from "react";
import {EmployeeResponse} from "@/app/types";
import {instance} from "@/app/api/instance";
import {useParams} from "next/navigation";

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (text: string, assignedTo: number[], files: File[]) => void;
}

export const CreateTaskModal = ({isOpen, onClose, onCreate}: CreateTicketModalProps) => {
    const [text, setText] = useState("");
    const [assignedTo, setAssignedTo] = useState<number[]>([]);
    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const projectId = useParams().projectId;
    const fetchEmployees = async () => {
        try {
            const response = await instance.get("/employees", {params: {project_id: projectId}});
            setEmployees(response.data.content);
        } catch (e) {
            console.error("Error fetching users", e);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchEmployees();
        setAssignedTo([]); // сброс выбранных пользователей
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
    useEffect(() => {
        if (!isOpen) return;

        const handleDocumentPaste = (e: ClipboardEvent) => {
            const items = Array.from(e.clipboardData?.items || []);
            const images = items
                .map(item => item.getAsFile())
                .filter((f): f is File => !!f);

            if (images.length > 0) {
                e.preventDefault();
                setFiles(prev => {
                    const existing = new Set(prev.map(f => f.name + f.size));
                    const unique = images.filter(f => !existing.has(f.name + f.size));
                    return [...prev, ...unique];
                });
            }
        };

        document.addEventListener("paste", handleDocumentPaste);
        return () => document.removeEventListener("paste", handleDocumentPaste);
    }, [isOpen]);


    if (!isOpen) return null;

    const handleCreate = () => {
        onCreate(text, assignedTo, files);
        setText("");
        setAssignedTo([]);
        setFiles([]);
        setDropdownOpen(false);
    };

    const toggleUser = (id: number) => {
        setAssignedTo(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    // Drag & drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length === 0) return;

        setFiles(prev => {
            const existing = new Set(prev.map(f => f.name + f.size));
            const unique = droppedFiles.filter(f => !existing.has(f.name + f.size));
            return [...prev, ...unique];
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // needed or drop won't fire
    };

// Paste
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = Array.from(e.clipboardData.items);
        const images = items
            .map(item => item.getAsFile())
            .filter((f): f is File => !!f);

        if (images.length > 0) {
            e.preventDefault();
            setFiles(prev => {
                const existing = new Set(prev.map(f => f.name + f.size));
                const unique = images.filter(f => !existing.has(f.name + f.size));
                return [...prev, ...unique];
            });
        }
    };


    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 text-white rounded-2xl shadow-xl p-6 w-full max-w-2xl pointer-events-auto">

                {/* Заголовок */}
                <h2 className="text-2xl font-bold mb-6 text-center border-b border-gray-700 pb-3">
                    Створити Задачу
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

                    {/* Назначение */}
                    <div className="relative flex flex-col gap-1">
                        <label className="text-sm font-medium">Призначено:</label>
                        <button
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-left hover:bg-gray-700 flex justify-between items-center text-sm transition"
                        >
                            {assignedTo.length === 0
                                ? "Кому ▾"
                                : assignedTo
                                    .map((id) => employees.find((u) => u.id === id)?.name)
                                    .join(", ")}
                            <span className="ml-2 text-gray-400">▾</span>
                        </button>

                        {dropdownOpen && (
                            <div
                                ref={dropdownRef}
                                className="absolute top-full mt-1 w-full max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
                            >
                                {employees.map((user) => (
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
                                        <span>{user.name}</span>
                                        {assignedTo.includes(user.id) && (
                                            <span className="focus:ring-purple-900  font-bold">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Файлы / Dropzone */}
                    <div className="flex flex-col gap-1">
                        <div
                            // ref={dropRef}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onPaste={handlePaste}
                            className="w-full min-h-[100px] border-2 border-dashed border-gray-700 rounded-lg bg-gray-800 flex flex-col items-center justify-center text-gray-400 p-4 cursor-pointer hover:border-purple-900 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {files.length === 0 ? (
                                <span>Перетягніть файли сюди, вставте або оберіть через провідник 📎</span>
                            ) : (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {files.map((f, i) => (
                                        <div key={i}
                                             className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm">
                                            {f.name}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFiles(prev => prev.filter((_, idx) => idx !== i));
                                                }}
                                                className="text-red-400 hover:text-red-600 transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                setFiles(prev => [...prev, ...selectedFiles]);
                                e.target.value = "";
                            }}
                        />
                    </div>
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