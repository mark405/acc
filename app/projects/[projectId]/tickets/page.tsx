"use client";


import React, {useEffect, useState} from "react";
import {EmployeeResponse, TicketResponse} from "@/app/types";
import {instance} from "@/app/api/instance";
import {CreateTicketModal} from "@/app/components/CreateTicketModal";
import {motion} from "framer-motion";
import Pagination from "@/app/components/Pagination";
import {useParams} from "next/navigation";
import {HttpStatusCode} from "axios";

export default function TicketsPage() {
    const [tickets, setTickets] = useState<TicketResponse[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [filterType, setFilterType] = useState<"TECH_GOAL" | "ADVERTISER_REQUEST" | "OFFERS_REQUEST" | "ALL">("ALL");
    const [statusType, setStatusType] = useState<"OPENED" | "CLOSED" | "ALL">("ALL");
    const [preview, setPreview] = useState<string | null>(null);

    const [sortBy] = useState("id");
    const [direction] = useState("desc");
    const [page, setPage] = useState(0);
    const [size] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);

    const projectId = useParams().projectId;
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

    const fetchTickets = async () => {
        let createdBy;
        let assignedTo;
        let types;
        if (employee?.role == "MANAGER") {
            createdBy = employee?.id;
        }
        if (employee?.role == "OFFERS_MANAGER") {
            assignedTo = employee?.id;
            types = ["ADVERTISER_REQUEST", "OFFERS_REQUEST"];
        }
        if (employee?.role == "TECH_MANAGER") {
            assignedTo = employee?.id;
            createdBy = employee?.id;
        }
        if (employee?.role == "ADMIN" || employee?.role == "MANAGER" || employee?.role == "HEAD_OF_AFFILIATE") {
            types = filterType !== "ALL" ? [filterType] : undefined;
        }

        const params: any = {
            sort_by: sortBy,
            direction,
            page,
            size,
            created_by: createdBy,
            assigned_to: assignedTo,
            project_id: projectId,
        };

        if (types) params.types = types;
        if (statusType !== "ALL") params.status = statusType;

        const response = await instance.post("/tickets", params);
        setTickets(response.data.content);
        setTotalPages(response.data.total_pages);
    };


    const handleCreateTicket = async (
        text: string,
        type: "TECH_GOAL" | "ADVERTISER_REQUEST" | "OFFERS_REQUEST",
        assignedTo: number[],
        files: File[]
    ) => {
        const formData = new FormData();
        formData.append("text", text);
        formData.append("type", type);
        assignedTo.forEach(id => formData.append("assignedTo", id.toString()));
        files.forEach(file => formData.append("files", file));
        formData.append("projectId", String(projectId));
        await instance.post("/tickets/create", formData, {
            headers: {"Content-Type": "multipart/form-data"},
        });

        setShowModal(false);
        fetchTickets();
    };

    useEffect(() => {
        fetchEmployee();
    }, []);

    useEffect(() => {
        if (!employee) return;
        fetchTickets();
    }, [employee, page, filterType, statusType]);

    const statusLabels: Record<string, string> = {
        OPENED: "Відкрито",
        IN_PROGRESS: "В роботі",
        CLOSED: "Закрито",
    };

    return (
        <>
        <div className="p-4 max-w-6xl mx-auto scale-[0.95] origin-top">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-white">Тікети</h1>

                <div className="flex items-center gap-3">
                    {(employee?.role === "ADMIN" || employee?.role === "HEAD_OF_AFFILIATE" || employee?.role === "MANAGER") && (
                        <div className="flex items-center gap-2 bg-indigo-600 text-white shadow rounded-xl px-4 py-2">
                            <select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(
                                        e.target.value as "TECH_GOAL" | "ADVERTISER_REQUEST" | "ALL"
                                    );
                                    setPage(0);
                                }}
                                className="bg-indigo-600 text-white font-medium outline-none focus:ring-0 focus:outline-none"
                            >
                                <option value="ALL">Всі типи</option>
                                <option value="TECH_GOAL">Tech Goal</option>
                                <option value="ADVERTISER_REQUEST">Запити рекламодавцям</option>
                                <option value="OFFERS_REQUEST">Запити на офери</option>
                            </select>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-indigo-600 text-white shadow rounded-xl px-4 py-2">
                        <select
                            value={statusType}
                            onChange={(e) => {
                                setStatusType(
                                    e.target.value as "OPENED" | "CLOSED" | "ALL"
                                );
                                setPage(0);
                            }}
                            className="bg-indigo-600 text-white font-medium outline-none focus:ring-0 focus:outline-none"
                        >
                            <option value="ALL">Всі статуси</option>
                            <option value="OPENED">Відкриті</option>
                            <option value="CLOSED">Закриті</option>
                        </select>
                    </div>

                    {(employee?.role === "MANAGER" || employee?.role === "TECH_MANAGER" || employee?.role === "HEAD_OF_AFFILIATE") && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="h-12 w-12 rounded-2xl text-2xl font-bold text-white bg-gradient-to-br bg-gray-700 shadow hover:scale-105 active:scale-95 transition"
                        >
                            +
                        </button>
                    )}
                </div>
            </div>

            {/* Tickets */}
            <div className="grid gap-6">
                {tickets.map((ticket, i) => (
                    <motion.div
                        key={ticket.id}
                        initial={{opacity: 0, y: 15}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: i * 0.03}}
                        onClick={() =>
                            (window.location.href = `/projects/${projectId}/tickets/${ticket.id}`)
                        }
                        className="group border-3 border-gray-400 bg-gray-700/50 rounded-2xl p-6  shadow-sm hover:shadow-xl transition cursor-pointer"
                    >
                        {/* top */}
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="space-y-1">
                                <div className="text-xl font-bold text-white">#{ticket.id}</div>

                                <div className="text-sm text-gray-500">
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
                                    {ticket.status === "IN_PROGRESS" &&
                                        ticket.operated_by && (
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

                        {/* body */}
                        <div className="text-gray-200 text-lg whitespace-pre-wrap leading-relaxed">
                            {ticket.text}
                        </div>
                        {/* files */}
                        {ticket.files?.length > 0 && (
                            <div className="mt-5 border-t pt-4">
                                <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
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
                        <div className="mt-6 flex justify-between border-t border-gray-500 items-center pt-4">
                            {/* слева: информация о создателе и назначенных */}
                            <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
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
                        </div>
                    </motion.div>
                ))}
            </div>
            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />
            {/* Modal */}
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
        </div>
    <CreateTicketModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateTicket}
    />
    </>
    );
}
