"use client";

import React, {useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {instance} from "@/app/api/instance";
import {CommentResponse, EmployeeResponse, TicketResponse} from "@/app/types";
import {useAuth} from "@/app/components/AuthProvider";
import {EditTicketModal} from "@/app/components/EditTicketModal";
import {motion} from "framer-motion";
import {EditCommentModal} from "@/app/components/EditTicketCommentModal";
import {HttpStatusCode} from "axios";

export default function TicketDetailsPage() {
    const {ticketId} = useParams();

    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);

    // Для нового комментария
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    // Для редактирования комментария
    const [editingId, setEditingId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [editModalComment, setEditModalComment] = useState<CommentResponse | null>(null);

    const [preview, setPreview] = useState<string | null>(null);

    const [editModalTicket, setEditModalTicket] = useState<TicketResponse | null>(null);
    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);

    const router = useRouter();
    const projectId = useParams().projectId;

    // Загрузка тикета и комментариев
    const load = async () => {
        const t = await instance.get(`/tickets/${ticketId}`);
        const c = await instance.get(`/tickets/${ticketId}/comments`);
        setTicket(t.data);
        setComments(c.data);
    };
    const fetchEmployee = async () => {
        try {
            const res = await instance.get("/employees/by_user/" + projectId);
            if (res.status === HttpStatusCode.Ok) {
                setEmployee(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch employee:", err);
        }
    };
    useEffect(() => {
        fetchEmployee();
        load();
    }, [ticketId]);

    // Сохранение редактирования комментария
    const saveEdit = async (
        commentId: number,
        text: string,
        filesToAdd: File[],
        filesToDelete: number[]
    ) => {
        const fd = new FormData();
        fd.append("text", text);

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
            const statusMap = {
                OPENED: "IN_PROGRESS",
                IN_PROGRESS: "CLOSED",
                CLOSED: "OPENED",
            } as const;

            const newStatus = statusMap[ticket.status];
            await instance.put(`/tickets/status/${ticket.id}`, {status: newStatus});
            load();
        } catch (err) {
            console.error("Помилка при зміні статусу тікета:", err);
        }
    };

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
    const handlePasteNew = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = Array.from(e.clipboardData.items);
        const images = items.map(item => item.getAsFile()).filter((f): f is File => !!f);

        if (images.length > 0) {
            e.preventDefault();
            setFiles(prev => {
                const existing = new Set(prev.map(f => f.name + f.size));
                const unique = images.filter(f => !existing.has(f.name + f.size));
                return [...prev, ...unique];
            });
        }
    };


    const handleDeleteTicket = async (id: number) => {
        try {
            await instance.delete(`/tickets/${id}`);
            router.push(`/projects/${projectId}/tickets`);
        } catch (err) {
            console.error("Помилка при видаленні тікета:", err);
        }
    };
    const statusLabels: Record<string, string> = {
        OPENED: "Відкрито",
        IN_PROGRESS: "В роботі",
        CLOSED: "Закрито",
    };

    const isWorker = employee?.role === "OFFERS_MANAGER" || employee?.role === "TECH_MANAGER";

    const statusButtonMap: Record<string, string> = {
        OPENED: "Взяти в роботу",
        IN_PROGRESS: "Закрити",
        CLOSED: "Відкрити",
    };
    useEffect(() => {
        if (!ticketId) return;

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
    }, [ticketId]);

    if (!ticket) {
        return <div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Ticket Card */}
            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                className="border-3 border-gray-400 shadow rounded-2xl p-6 relative bg-gray-700/50"
            >
                {/* header */}
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                    <div>
                        <div className="text-2xl font-bold text-white">#{ticket.id}</div>
                        <div className="text-xs text-gray-400">
                            {new Date(ticket.created_at).toLocaleString("uk-UA")}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
        <span
            className={`px-3 py-1 rounded-full text-md font-semibold tracking-wide
          ${
                ticket.status === "OPENED"
                    ? "bg-green-100 text-green-700"
                    : ticket.status === "IN_PROGRESS"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-200 text-gray-700"
            }`}
        >
          {statusLabels[ticket.status]}
            {ticket.status === "IN_PROGRESS" && ticket.operated_by && (
                <span className="ml-1 text-gray-600">
              · {ticket.operated_by.name}
            </span>
            )}
        </span>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide${
                                ticket.type === "ADVERTISER_REQUEST"
                                    ? "bg-purple-100 text-purple-700"
                                    : ticket.type === "TECH_GOAL"
                                        ? "bg-blue-100 text-blue-700"
                                        : ticket.type === "OFFERS_REQUEST"
                                            ? "bg-green-100 text-orange-400"
                                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                                  {ticket.type === "ADVERTISER_REQUEST"
                                      ? "Запити рекламодавцям"
                                      : ticket.type === "TECH_GOAL"
                                          ? "🛠 Tech Goal"
                                          : ticket.type === "OFFERS_REQUEST"
                                              ? "📦 Запити на офери"
                                              : ticket.type}
                                </span>
                    </div>
                </div>

                {/* text */}
                <div className="text-gray-200 text-lg font-semibold whitespace-pre-wrap leading-relaxed">
                    {ticket.text}
                </div>
                {ticket.files?.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-2">
                            Файли
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {ticket.files.map((file) => {
                                const url = process.env.NEXT_PUBLIC_API_URL + "/" + file.file_url;
                                const fileName = file.file_name;

                                const isImage = /\.(png|jpe?g)$/i.test(fileName);

                                if (isImage) {
                                    return (
                                        <img
                                            key={file.id}
                                            src={url}
                                            alt={fileName}
                                            onClick={() => setPreview(url)}
                                            className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:scale-105 transition"
                                        />
                                    );
                                }

                                return (
                                    <a
                                        key={file.id}
                                        href={url}
                                        download={fileName}
                                        className="w-24 h-24 flex flex-col items-center justify-center border rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer p-2 text-xs text-center overflow-hidden"
                                        title={fileName}
                                    >
                                        <span className="text-2xl mb-1">📝</span>
                                        <span className="truncate w-full">{fileName}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* footer карточки */}
                <div className="mt-6 flex justify-between border-t items-center pt-4 border-gray-500">
                    {/* слева: информация о создателе и назначенных */}
                    <div className="text-sm text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
        <span>
            Створив <b>{ticket.created_by.name}</b>
        </span>

                        {ticket.assigned_to.length > 0 && (
                            <span>
                Для{" "}
                                {ticket.assigned_to.map((u, i) => (
                                    <span key={u.id}>
                        <b>{u.name}</b>
                                        {i < ticket.assigned_to.length - 1 && ", "}
                    </span>
                                ))}
            </span>
                        )}
                    </div>

                    {/* справа: кнопки */}
                    <div className="flex gap-2">
                        {employee?.role === "MANAGER" && (
                            <>
                                <button
                                    onClick={() => setEditModalTicket(ticket)}
                                    className="px-3 py-1 text-xs rounded-lg bg-purple-50 text-blue-700 hover:scale-105 active:scale-95 transition"
                                >
                                    Редагувати
                                </button>
                                <button
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                    className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:scale-105 active:scale-95 transition"
                                >
                                    Видалити
                                </button>
                            </>
                        )}
                        {employee?.role === "ADMIN" && (
                            <>
                                <button
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                    className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:scale-105 active:scale-95 transition"
                                >
                                    Видалити
                                </button>
                            </>
                        )}

                        {isWorker && statusButtonMap[ticket.status] && (
                            <button
                                onClick={() => handleChangeStatusTicket(ticket)}
                                className="px-3 py-1 text-xs rounded-lg bg-gray-700 text-white hover:scale-105 active:scale-95 transition"
                            >
                                {statusButtonMap[ticket.status]}
                            </button>
                        )}
                    </div>
                </div>

                {editModalTicket && (
                    <EditTicketModal
                        isOpen={!!editModalTicket}
                        ticket={editModalTicket}
                        onClose={() => setEditModalTicket(null)}
                        onUpdate={load}
                    />
                )}
            </motion.div>

            {/* Comments */}
            <div>
                <h2 className="text-lg font-bold mb-4 text-white">Коментарі</h2>

                <div className="space-y-4">
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            className={`relative rounded-xl border p-4 shadow-sm  transition bg-gray-700/50 border-gray-400 text-white
            ${editingId === c.id ? "ring-2 ring-yellow-300" : ""}`}
                        >
                            {/* actions */}
                            {employee?.id === c.created_by.id && (
                                <div className="absolute right-3 top-3 flex gap-2">
                                    {editingId !== c.id && (
                                        <>
                                            <button
                                                onClick={() => setEditModalComment(c)}
                                                className="text-xs px-2 py-1 rounded bg-purple-50 text-blue-700 hover:scale-105 active:scale-95 transition"
                                            >
                                                Редагувати
                                            </button>
                                            <button
                                                onClick={() => deleteComment(c.id)}
                                                className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:scale-105 active:scale-95 transition"
                                            >
                                                Видалити
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="text-sm text-white whitespace-pre-wrap">
                                {c.text}
                            </div>
                            {c.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                    {c.attachments.map((a) => {
                                        const url = process.env.NEXT_PUBLIC_API_URL + "/" + a.file_url;
                                        const fileName = a.file_name;

                                        const isImage = /\.(png|jpe?g)$/i.test(fileName);

                                        if (isImage) {
                                            return (
                                                <img
                                                    key={a.id}
                                                    src={url}
                                                    alt={fileName}
                                                    onClick={() => setPreview(url)}
                                                    className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:scale-105 transition"
                                                />
                                            );
                                        }

                                        return (
                                            <a
                                                key={a.id}
                                                href={url}
                                                download={fileName}
                                                className="w-24 h-24 flex flex-col items-center justify-center border rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer p-2 text-xs text-center overflow-hidden"
                                                title={fileName}
                                            >
                                                <span className="text-2xl mb-1">📝</span>
                                                <span className="truncate w-full">{fileName}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="text-xs text-gray-400 mt-3">
                                <b>{c.created_by.name}</b> · {new Date(c.created_at).toLocaleString("uk-UA")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* add comment */}
                <div className="mt-6  border rounded-xl p-4 shadow-sm space-y-3 bg-gray-700/50 border-gray-400">
  <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-300 outline-none text-white  border-gray-400 placeholder-white"
      placeholder="Написати коментар..."
  />

                    {/* selected files preview */}
                    <div className="flex flex-col gap-1">
                        <div
                            // ref={dropRef}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onPaste={handlePasteNew}
                            className="w-full min-h-[100px] border-2 border-dashed border-gray-400 rounded-lg  flex flex-col items-center justify-center text-white p-4 cursor-pointer hover:border-purple-900 transition"
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
                            id="comment-files"
                            className="hidden"
                            onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                setFiles(prev => [...prev, ...selectedFiles]);
                                e.target.value = "";
                            }}
                        />
                    </div>

                    <button
                        onClick={addComment}
                        className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:scale-[1.02] active:scale-95 transition"
                    >
                        Додати коментар
                    </button>
                </div>
            </div>
            {preview && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                    onClick={() => setPreview(null)}
                >
                    <img
                        src={preview}
                        className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
                    />
                </div>
            )}
            {editModalComment && (
                <EditCommentModal
                    isOpen={!!editModalComment}
                    comment={editModalComment}
                    onClose={() => setEditModalComment(null)}
                    onSave={async (id, text, filesToAdd, filesToDelete) => {
                        await saveEdit(id, text, filesToAdd, filesToDelete);
                        setEditModalComment(null);
                    }}
                />
            )}
        </div>
    );
}

