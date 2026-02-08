"use client";


import React, {useEffect, useRef, useState} from "react";
import {CommentResponse, FileResponse, TicketResponse} from "@/app/types";
import {instance} from "@/app/api/instance";
import {CreateTicketModal} from "@/app/components/CreateTicketModal";
import {EditTicketModal} from "@/app/components/EditTicketModal";
import {useAuth} from "@/app/components/AuthProvider";

export default function TicketsPage() {
    const [tickets, setTickets] = useState<TicketResponse[]>([]);
    const [showModal, setShowModal] = useState(false);

    const [sortBy, setSortBy] = useState("id");
    const [direction, setDirection] = useState("desc");
    const [page, setPage] = useState(0);
    const [size] = useState(25);
    const [totalPages, setTotalPages] = useState(1);

    const [editModalTicket, setEditModalTicket] = useState<TicketResponse | null>(null);
    const {user} = useAuth();

    const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
    const [comments, setComments] = useState<Record<number, CommentResponse[]>>({});
    const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
    const [newCommentFiles, setNewCommentFiles] = useState<Record<number, File[]>>({});

    const handleDeleteComment = async (ticketId: number, commentId: number) => {
        try {
            await instance.delete(`/tickets/comments/${commentId}`);

            // update UI without refetch
            setComments(prev => ({
                ...prev,
                [ticketId]: prev[ticketId].filter(c => c.id !== commentId)
            }));
        } catch (err) {
            console.error("Помилка при видаленні коментаря:", err);
        }
    };


    const toggleComments = async (ticketId: number) => {
        setOpenComments(prev => ({
            ...prev,
            [ticketId]: !prev[ticketId]
        }));

        if (!comments[ticketId]) {
            const res = await instance.get(`/tickets/${ticketId}/comments`);
            setComments(prev => ({
                ...prev,
                [ticketId]: res.data
            }));
        }
    };

    const handleAddComment = async (ticketId: number) => {
        const formData = new FormData();
        formData.append("text", newCommentText[ticketId] || "");

        (newCommentFiles[ticketId] || []).forEach(file =>
            formData.append("attachments", file)
        );

        await instance.post(`/tickets/${ticketId}/comments`, formData, {
            headers: {"Content-Type": "multipart/form-data"}
        });

        // reload comments
        const res = await instance.get(`/tickets/${ticketId}/comments`);
        setComments(prev => ({...prev, [ticketId]: res.data}));

        setNewCommentText(prev => ({...prev, [ticketId]: ""}));
        setNewCommentFiles(prev => ({...prev, [ticketId]: []}));
    };

    const fetchTickets = async () => {
        let createdBy;
        let assignedTo;
        let type;
        if (user?.role == 'MANAGER') {
            createdBy = user?.id;
        } else if (user?.role == 'OFFERS_MANAGER' || user?.role == 'TECH_MANAGER') {
            assignedTo = user?.id;
            type = user?.role == 'OFFERS_MANAGER' ? 'ADVERTISER_REQUEST' : 'TECH_GOAL';
        }
        const params = {
            sort_by: sortBy,
            direction,
            page,
            size,
            type: type,
            created_by: createdBy,
            assigned_to: assignedTo
        };
        const response = await instance.post("/tickets", params);
        setTickets(response.data.content);
        setTotalPages(response.data.total_pages);
    };

    const handleDeleteTicket = async (id: number) => {
        try {
            await instance.delete(`/tickets/${id}`);
            // Remove the deleted ticket from the state
            setTickets(prev => prev.filter(ticket => ticket.id !== id));
        } catch (err) {
            console.error("Помилка при видаленні тікета:", err);
        }
    };

    const handleCreateTicket = async (
        text: string,
        type: "TECH_GOAL" | "ADVERTISER_REQUEST",
        assignedTo: number[],
        files: File[]
    ) => {
        const formData = new FormData();
        formData.append("text", text);
        formData.append("type", type);
        assignedTo.forEach(id => formData.append("assignedTo", id.toString()));
        files.forEach(file => formData.append("files", file));

        await instance.post("/tickets/create", formData, {
            headers: {"Content-Type": "multipart/form-data"},
        });

        setShowModal(false);
        fetchTickets();
    };

    useEffect(() => {
        fetchTickets();
    }, [page]);

    const statusLabels: Record<string, string> = {
        OPENED: "Відкрито",
        CLOSED: "Закрито",
    };

    const handleChangeStatusTicket = async (ticket: TicketResponse) => {
        try {
            const newStatus = ticket.status === "OPENED" ? "CLOSED" : "OPENED";
            await instance.put(`/tickets/status/${ticket.id}`, {status: newStatus});
            fetchTickets();
        } catch (err) {
            console.error("Помилка при зміні статусу тікета:", err);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Тікети</h1>
                {user?.role == 'MANAGER' && <button
                    onClick={() => setShowModal(true)}
                    className="text-white bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-full text-xl font-bold"
                >
                    +
                </button>}
            </div>

            {/* Tickets list */}
            <div className="space-y-4">
                {tickets.map((ticket) => (
                    <React.Fragment key={ticket.id}>
                    <div key={ticket.id} className="border rounded-lg p-4 shadow flex flex-col gap-2 relative">
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
                            <div className="text-sm text-gray-600">
                                Тип: <b>
                                {ticket.type === "ADVERTISER_REQUEST" ? "Запит на рекламу" :
                                    ticket.type === "TECH_GOAL" ? "Tech Goal" : ticket.type}
                            </b>
                            </div>
                            <div className="mt-2 text-gray-800">{ticket.text}</div>
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
                                className="text-xs text-gray-500 mt-2">Коли: {new Date(ticket.created_at).toLocaleString("uk-UA")}</div>
                            <div className="mt-2">
                                {ticket.files && ticket.files.length > 0 && (
                                    <div className="text-sm text-gray-800">
                                        Файли:
                                        <ul className="mt-1 space-y-1">
                                            {ticket.files.map((file) => (
                                                <li key={file.id}>
                                                    <a
                                                        href={process.env.NEXT_PUBLIC_API_URL + "/" + file.file_url}        // URL to download the file
                                                        download={file.file_name}   // Suggests filename for download
                                                        className="underline hover:text-gray-900"
                                                    >
                                                        {file.file_name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
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
                        </div>
                        {/* COMMENTS TOGGLE */}
                        <div
                            className="mt-4 flex items-center justify-between cursor-pointer
             text-sm font-semibold text-gray-700
             hover:text-gray-900"
                            onClick={() => toggleComments(ticket.id)}
                        >
                            <span>Коментарі</span>
                            <span className="text-gray-500">
    {openComments[ticket.id] ? "▲" : "▼"}
  </span>
                        </div>


                        {/* COMMENTS BODY */}
                        {openComments[ticket.id] && (
                            <div className="mt-3 border-t pt-3 space-y-3">

                                {/* COMMENTS LIST */}
                                {comments[ticket.id]?.map(comment => (
                                    <div key={comment.id} className="border rounded-md p-3 text-sm relative">
                                        {user?.id === comment.created_by.id && (
                                            <button
                                                onClick={() => handleDeleteComment(ticket.id, comment.id)}
                                                className="absolute top-2 right-2 text-xs text-red-600 hover:text-red-800"
                                                title="Видалити коментар"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        <div className="text-gray-800 leading-relaxed">
                                            {comment.text}
                                        </div>

                                        {comment.attachments?.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {comment.attachments.map((file: FileResponse) => (
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
                                        <div className="mt-1 text-xs text-gray-500">
                                            <b>{comment.created_by.username}</b> ·{" "}
                                            {new Date(comment.created_at).toLocaleString("uk-UA")}
                                        </div>
                                    </div>
                                ))}

                                {/* ADD COMMENT */}
                                <div className="border rounded p-2 ">
            <textarea
                className="w-full border rounded p-2 text-sm"
                placeholder="Написати коментар..."
                value={newCommentText[ticket.id] || ""}
                onChange={e =>
                    setNewCommentText(prev => ({
                        ...prev,
                        [ticket.id]: e.target.value
                    }))
                }
            />

                                    <label
                                        className="block cursor-pointer px-2 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:border-gray-400">
                                        {(newCommentFiles[ticket.id]?.length ?? 0) === 0
                                            ? "Виберіть файли…"
                                            : newCommentFiles[ticket.id]!.map(f => f.name).join(", ")
                                        }

                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            onChange={e => {
                                                const selectedFiles = Array.from(e.target.files || []);

                                                setNewCommentFiles(prev => ({
                                                    ...prev,
                                                    [ticket.id]: [
                                                        ...(prev[ticket.id] || []),
                                                        ...selectedFiles
                                                    ]
                                                }));

                                                // allow selecting the same file again if needed
                                                e.currentTarget.value = "";
                                            }}
                                        />
                                    </label>

                                    <button
                                        onClick={() => handleAddComment(ticket.id)}
                                        className=" px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900"
                                    >
                                        ➕ Додати
                                    </button>
                                </div>
                            </div>
                        )}

                    </React.Fragment>
                ))}
            </div>
            {tickets.length > 0 && <div className="mt-4 flex space-x-2 justify-center">
                {page > 0 && (
                    <button
                        onClick={() => setPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                    >
                        Минула
                    </button>)}
                <span className="px-3 py-1">Сторінка {tickets.length == 0 ? 0 : page + 1} з {totalPages}</span>
                {page + 1 < totalPages && (
                    <button
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                    >
                        Наступна
                    </button>)}
            </div>}
            <CreateTicketModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreate={handleCreateTicket}
            />
            {editModalTicket && (
                <EditTicketModal
                    isOpen={!!editModalTicket}     // <-- new prop
                    ticket={editModalTicket}
                    onClose={() => setEditModalTicket(null)} // <-- rename from onCancel
                    onUpdate={fetchTickets}
                />
            )}
        </div>
    );
}