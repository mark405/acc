"use client";

import React, {useEffect, useRef, useState} from "react";
import { CommentResponse } from "@/app/types";

interface EditCommentModalProps {
    isOpen: boolean;
    comment: CommentResponse;
    onClose: () => void;
    onSave: (commentId: number, text: string, filesToAdd: File[], filesToDelete: number[]) => Promise<void>;
}

export const EditCommentModal: React.FC<EditCommentModalProps> = ({ isOpen, comment, onClose, onSave }) => {
    const [editText, setEditText] = useState(comment.text);
    const [filesToAdd, setFilesToAdd] = useState<File[]>([]);
    const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (!isOpen) return;

        const handleDocumentPaste = (e: ClipboardEvent) => {
            const items = Array.from(e.clipboardData?.items || []);
            const images = items
                .map(item => item.getAsFile())
                .filter((f): f is File => !!f);

            if (images.length > 0) {
                e.preventDefault();
                setFilesToAdd(prev => {
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

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = Array.from(e.clipboardData.items);
        const images = items.map(item => item.getAsFile()).filter((f): f is File => !!f);

        if (images.length > 0) {
            e.preventDefault();
            setFilesToAdd(prev => {
                const existing = new Set(prev.map(f => f.name + f.size));
                const unique = images.filter(f => !existing.has(f.name + f.size));
                return [...prev, ...unique];
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 relative">
                <h3 className="text-lg font-bold">Редагувати коментар</h3>

                <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                />

                <div
                    onDrop={(e) => {
                        e.preventDefault();
                        const droppedFiles = Array.from(e.dataTransfer.files);
                        setFilesToAdd(prev => [...prev, ...droppedFiles]);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onPaste={handlePaste}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[100px] border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 cursor-pointer hover:border-purple-900 transition"
                >
                    {filesToAdd.length === 0 && comment.attachments.length === 0 ? (
                        <span>Перетягніть файли сюди, вставте або оберіть через провідник 📎</span>
                    ) : (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {comment.attachments.map(f => (
                                <div
                                    key={`existing-${f.id}`}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                        filesToDelete.includes(f.id) ? "bg-red-900" : "bg-gray-700"
                                    }`}
                                >
                                    {f.file_name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFilesToDelete(prev =>
                                                prev.includes(f.id)
                                                    ? prev.filter(id => id !== f.id)
                                                    : [...prev, f.id]
                                            );
                                        }}
                                        className="text-red-400 hover:text-red-600 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {filesToAdd.map((f, i) => (
                                <div
                                    key={`new-${i}`}
                                    className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
                                >
                                    {f.name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFilesToAdd(prev => prev.filter((_, idx) => idx !== i));
                                        }}
                                        className="text-red-400 hover:text-red-600 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => {
                            const selectedFiles = Array.from(e.target.files || []);
                            setFilesToAdd(prev => [...prev, ...selectedFiles]);
                            e.target.value = "";
                        }}
                    />
                </div>

                <div className="flex gap-2 justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg text-sm"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={() => onSave(comment.id, editText, filesToAdd, filesToDelete)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
                    >
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
};