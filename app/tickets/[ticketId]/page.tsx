"use client";

import React, {useEffect, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {instance} from "@/app/api/instance";
import {TicketResponse, CommentResponse, FileResponse} from "@/app/types";
import {useAuth} from "@/app/components/AuthProvider";
import {EditTicketModal} from "@/app/components/EditTicketModal";
import {motion} from "framer-motion";

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
        IN_PROGRESS: "В роботі",
        CLOSED: "Закрито",
    };

    const isWorker = user?.role === "OFFERS_MANAGER" || user?.role === "TECH_MANAGER";

    const statusButtonMap: Record<string, string> = {
        OPENED: "Взяти в роботу",
        IN_PROGRESS: "Закрити",
        CLOSED: "Відкрити",
    };

    if (!ticket) {
        return <div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Ticket Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-3 border-gray-600rounded-2xl shadow rounded-2xl p-6 relative"
            >
                {/* header */}
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                    <div>
                        <div className="text-2xl font-bold">#{ticket.id}</div>
                        <div className="text-xs text-gray-500">
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
              · {ticket.operated_by.username}
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
                <div className="text-gray-900 text-lg font-semibold whitespace-pre-wrap leading-relaxed">
                    {ticket.text}
                </div>
                {ticket.files?.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-2">
                            Файли
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ticket.files.map((file) => (
                                <a
                                    key={file.id}
                                    href={process.env.NEXT_PUBLIC_API_URL + "/" + file.file_url}
                                    download
                                    className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition"
                                >
                                    {file.file_name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                {/* footer карточки */}
                <div className="mt-6 flex justify-between border-t items-center pt-4">
                    {/* слева: информация о создателе и назначенных */}
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
        <span>
            Створив <b>{ticket.created_by.username}</b>
        </span>

                        {ticket.assigned_to.length > 0 && (
                            <span>
                Для{" "}
                                {ticket.assigned_to.map((u, i) => (
                                    <span key={u.id}>
                        <b>{u.username}</b>
                                        {i < ticket.assigned_to.length - 1 && ", "}
                    </span>
                                ))}
            </span>
                        )}
                    </div>

                    {/* справа: кнопки */}
                    <div className="flex gap-2">
                        {user?.role === "MANAGER" && (
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
                        {user?.role === "ADMIN" && (
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
                <h2 className="text-lg font-bold mb-4">Коментарі</h2>

                <div className="space-y-4">
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            className={`relative rounded-xl border p-4 shadow-sm  transition
            ${editingId === c.id ? "ring-2 ring-yellow-300" : ""}`}
                        >
                            {/* actions */}
                            {user?.id === c.created_by.id && (
                                <div className="absolute right-3 top-3 flex gap-2">
                                    {editingId !== c.id && (
                                        <button
                                            onClick={() => {
                                                setEditingId(c.id);
                                                setEditText(c.text);
                                                setFilesToAdd([]);
                                                setFilesToDelete([]);
                                            }}
                                            className="text-xs px-2 py-1 rounded bg-purple-50 text-blue-700 hover:scale-105 active:scale-95 transition"
                                        >
                                            Редагувати
                                        </button>
                                    )}

                                    <button
                                        onClick={() => deleteComment(c.id)}
                                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:scale-105 active:scale-95 transition"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            )}

                            {/* edit mode */}
                            {editingId === c.id ? (
                                <div className="space-y-3">
              <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
              />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 w-full text-left"
                                    >
                                        {filesToAdd.length === 0
                                            ? "Додати файли"
                                            : filesToAdd.map((f) => f.name).join(", ")}
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        hidden
                                        onChange={(e) => {
                                            const selected = Array.from(e.target.files || []);
                                            setFilesToAdd((prev) => [...prev, ...selected]);
                                        }}
                                    />

                                    {c.attachments?.length > 0 && (
                                        <div className="text-xs space-y-1">
                                            <div className="font-medium">Видалити файли</div>
                                            {c.attachments.map((f) => (
                                                <label key={f.id} className="flex gap-2">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked)
                                                                setFilesToDelete((p) => [...p, f.id]);
                                                            else
                                                                setFilesToDelete((p) =>
                                                                    p.filter((id) => id !== f.id)
                                                                );
                                                        }}
                                                    />
                                                    {f.file_name}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => saveEdit(c.id)}
                                            className="px-3 py-1 rounded-lg bg-gray-900 text-white text-xs"
                                        >
                                            Зберегти
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 rounded-lg border text-xs"
                                        >
                                            Скасувати
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                    {c.text}
                                </div>
                            )}

                            {/* attachments */}
                            {c.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {c.attachments.map((a) => (
                                        <a
                                            key={a.id}
                                            href={process.env.NEXT_PUBLIC_API_URL + "/" + a.file_url}
                                            download
                                            className="px-2 py-1 rounded bg-gray-100 text-xs"
                                        >
                                            {a.file_name}
                                        </a>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-gray-500 mt-3">
                                <b>{c.created_by.username}</b> · {new Date(c.created_at).toLocaleString("uk-UA")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* add comment */}
                <div className="mt-6  border rounded-xl p-4 shadow-sm space-y-3">
  <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
      placeholder="Написати коментар..."
  />

                    {/* hidden input */}
                    <input
                        type="file"
                        multiple
                        hidden
                        id="comment-files"
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    />

                    {/* custom uploader */}
                    <label
                        htmlFor="comment-files"
                        className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg p-3 text-sm bg-gray-100 hover:bg-gray-100 cursor-pointer transition"
                    >
                        📎 Додати файли
                    </label>

                    {/* selected files preview */}
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {files.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs"
                                >
                                    {f.name}
                                    <button
                                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={addComment}
                        className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:scale-[1.02] active:scale-95 transition"
                    >
                        Додати коментар
                    </button>
                </div>
            </div>
        </div>
    );
}

