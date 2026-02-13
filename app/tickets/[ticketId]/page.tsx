"use client";

import React, {useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {instance} from "@/app/api/instance";
import {TicketResponse, CommentResponse, FileResponse} from "@/app/types";
import {useAuth} from "@/app/components/AuthProvider";
import {EditTicketModal} from "@/app/components/EditTicketModal";

export default function TicketDetailsPage() {
    const {ticketId} = useParams();
    const {user} = useAuth();

    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);

    // Для нового комментария
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    // Для редактирования комментария
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [filesToAdd, setFilesToAdd] = useState<File[]>([]);
    const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [editModalTicket, setEditModalTicket] = useState<TicketResponse | null>(null);

    const router = useRouter();

    // Загрузка тикета и комментариев
    const load = async () => {
        const t = await instance.get(`/tickets/${ticketId}`);
        const c = await instance.get(`/tickets/${ticketId}/comments`);
        setTicket(t.data);
        setComments(c.data);
    };

    useEffect(() => {
        load();
    }, [ticketId]);

    // Сохранение редактирования комментария
    const saveEdit = async (commentId: number) => {
        const fd = new FormData();
        fd.append("text", editText);

        filesToAdd.forEach(f => fd.append("attachmentsToAdd", f));
        filesToDelete.forEach(id => fd.append("attachmentsToDelete", String(id)));

        const res = await instance.put(
            `/tickets/comments/${commentId}`,
            fd,
            {headers: {"Content-Type": "multipart/form-data"}}
        );

        setComments(prev =>
            prev.map(c =>
                c.id === commentId ? res.data : c
            )
        );

        setEditingId(null);
        setFilesToAdd([]);
        setFilesToDelete([]);
    };

    // Добавление нового комментария
    const addComment = async () => {
        const fd = new FormData();
        fd.append("text", text);
        files.forEach(f => fd.append("attachments", f));

        await instance.post(`/tickets/${ticketId}/comments`, fd, {
            headers: {"Content-Type": "multipart/form-data"}
        });

        setText("");
        setFiles([]);
        load();
    };

    // Удаление комментария
    const deleteComment = async (commentId: number) => {
        await instance.delete(`/tickets/comments/${commentId}`);
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    const handleChangeStatusTicket = async (ticket: TicketResponse) => {
        try {
            const newStatus = ticket.status === "OPENED" ? "CLOSED" : "OPENED";
            await instance.put(`/tickets/status/${ticket.id}`, {status: newStatus});
            load();
        } catch (err) {
            console.error("Помилка при зміні статусу тікета:", err);
        }
    };

    const handleDeleteTicket = async (id: number) => {
        try {
            await instance.delete(`/tickets/${id}`);
            router.push("/tickets");
        } catch (err) {
            console.error("Помилка при видаленні тікета:", err);
        }
    };
    const statusLabels: Record<string, string> = {
        OPENED: "Відкрито",
        CLOSED: "Закрито",
    };
    if (!ticket) {
        return <div></div>;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">

            {/* Тикет */}
            <div className="border rounded p-4 shadow relative">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">#{ticket.id}</span>
                    <span
                        className={`px-2 py-1 rounded text-sm font-semibold ${
                            ticket.status === "OPENED" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-800"
                        }`}
                    >
                                  {statusLabels[ticket.status]}
                                </span>
                </div>
                <div className="text-gray-800">{ticket.text}</div>
                <div className="mt-4">
                    <div className="text-sm text-gray-700">
                        Створив <b>{ticket.created_by.username}</b>
                    </div>
                    {ticket.assigned_to.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                            Призначений для:{" "}
                            {ticket.assigned_to.map((user, idx) => (
                                <span key={user.id}>
            <b>{user.username}</b>
                                    {idx < ticket.assigned_to.length - 1 ? ", " : ""}
        </span>
                            ))}
                        </div>

                    )}
                </div>
                <div
                    className="text-xs text-gray-500 mt-2">Коли: {new Date(ticket.created_at).toLocaleString("uk-UA")}
                </div>
                {ticket.files?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                        {ticket.files.map((file: FileResponse) => (
                            <li key={file.id}>
                                <a
                                    href={process.env.NEXT_PUBLIC_API_URL + "/" + file.file_url}
                                    className="underline"
                                    download
                                >
                                    {file.file_name}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
                {user?.role == 'MANAGER' &&
                    <>
                        <button
                            onClick={() => setEditModalTicket(ticket)}
                            className="absolute bottom-9 right-2 px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900"
                        >
                            Редагувати
                        </button>
                        <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-red-800 text-white rounded hover:bg-red-900"
                        >
                            Видалити
                        </button>
                    </>
                }
                {user?.role == 'OFFERS_MANAGER' || user?.role === 'TECH_MANAGER' && ticket.status === 'OPENED' &&
                    <button
                        onClick={() => handleChangeStatusTicket(ticket)}
                        className="absolute cursor-pointer bottom-9 right-2 px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                        Закрити
                    </button>
                }
                {user?.role == 'OFFERS_MANAGER' || user?.role === 'TECH_MANAGER' && ticket.status === 'CLOSED' &&
                    <button
                        onClick={() => handleChangeStatusTicket(ticket)}
                        className="absolute cursor-pointer bottom-9 right-2 px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                        Відкрити
                    </button>
                }
                {editModalTicket && (
                    <EditTicketModal
                        isOpen={!!editModalTicket}     // <-- new prop
                        ticket={editModalTicket}
                        onClose={() => setEditModalTicket(null)} // <-- rename from onCancel
                        onUpdate={load}
                    />
                )}
            </div>

            {/* Комментарии */}
            <div>
                <h2 className="font-semibold mb-3">Коментарі</h2>
                <div className="space-y-3">
                    {comments.map(c => (
                        <div key={c.id} className={`border rounded p-3 text-sm relative ${editingId === c.id ? "bg-yellow-50" : ""}`}>

                            {/* Кнопки редактирования и удаления */}
                            {user?.id === c.created_by.id && (
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {editingId !== c.id && (
                                        <button
                                            onClick={() => {
                                                setEditingId(c.id);
                                                setEditText(c.text);
                                                setFilesToAdd([]);
                                                setFilesToDelete([]);
                                            }}
                                            className="text-xs text-blue-600"
                                        >
                                            ✎
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteComment(c.id)}
                                        className="text-xs text-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Редактирование */}
                            {editingId === c.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editText}
                                        onChange={e => setEditText(e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                    />

                                    {/* Добавление файлов */}
                                    <div>
                                        <label className="block text-xs mb-1">Додати файли:</label>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full text-left px-2 py-2 border rounded bg-gray-100 text-sm"
                                        >
                                            {filesToAdd.length === 0
                                                ? "Виберіть файли..."
                                                : filesToAdd.map(f => f.name).join(", ")}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            hidden
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.files || []);
                                                setFilesToAdd(prev => [...prev, ...selected]);
                                            }}
                                        />
                                    </div>

                                    {/* Удаление существующих файлов */}
                                    {c.attachments?.length > 0 && (
                                        <div>
                                            <span className="text-xs">Видалити файли:</span>
                                            {c.attachments.map(f => (
                                                <label key={f.id} className="flex items-center gap-2 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setFilesToDelete(prev => [...prev, f.id]);
                                                            } else {
                                                                setFilesToDelete(prev => prev.filter(id => id !== f.id));
                                                            }
                                                        }}
                                                    />
                                                    {f.file_name}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Действия */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => saveEdit(c.id)}
                                            className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                        >
                                            Зберегти
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-2 py-1 text-xs border rounded"
                                        >
                                            Скасувати
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>{c.text}</div>
                            )}

                            {/* Существующие файлы */}
                            {c.attachments?.length > 0 && (
                                <ul className="mt-2">
                                    {c.attachments.map(a => (
                                        <li key={a.id}>
                                            <a
                                                href={process.env.NEXT_PUBLIC_API_URL + "/" + a.file_url}
                                                download
                                                className="underline"
                                            >
                                                {a.file_name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                                {c.created_by.username} · {new Date(c.created_at).toLocaleString("uk-UA")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Добавление нового комментария */}
                <div className="border rounded p-3 mt-4">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Коментар..."
                    />
                    <input
                        type="file"
                        multiple
                        onChange={e => setFiles(Array.from(e.target.files || []))}
                        className="mt-2"
                    />
                    <button
                        onClick={addComment}
                        className="mt-2 px-3 py-1 bg-gray-800 text-white rounded text-sm"
                    >
                        Додати
                    </button>
                </div>
            </div>
        </div>
    );
}