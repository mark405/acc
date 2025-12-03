"use client";

import React, {useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {EmployeeFinanceResponse, EmployeeResponse} from "@/app/types";
import {Check, Edit2, Plus, Trash, X} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import {useAuth} from "@/app/components/AuthProvider";


export default function FinancesPage({employeeId}: { employeeId: number }) {
    const { isAdmin } = useAuth();

    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
    const [finances, setFinances] = useState<EmployeeFinanceResponse[]>([]);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const [sortBy, setSortBy] = useState<string>("id");
    const [direction, setDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState<number>(0);
    const [size] = useState<number>(15); // количество записей на страницу
    const [totalPages, setTotalPages] = useState<number>(1);
    const [errors, setErrors] = useState<{
        startDate?: boolean;
        endDate?: boolean;
        incomeQFD?: boolean;
        paidRef?: boolean;
        percentQFD?: boolean
    }>({});

    const [adding, setAdding] = useState(false);
    const [newFinance, setNewFinance] = useState({
        startDate: "",
        endDate: "",
        employeeId: employeeId,
        incomeQFD: 0,
        paidRef: 0,
        percentQFD: 0,
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingFinance, setEditingFinance] = useState({
        startDate: "" as string,
        endDate: "" as string,
        incomeQFD: 0,
        paidRef: 0,
        percentQFD: 0,
    });

    const [isAdvanceModalOpen, setAdvanceModalOpen] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [advanceDate, setAdvanceDate] = useState("");
    const [advanceDateError, setAdvanceDateError] = useState<string | null>(null);

    const openAdvanceModal = () => setAdvanceModalOpen(true);
    const closeAdvanceModal = () => setAdvanceModalOpen(false);

    const isAdvanceDateValid = (date: string) => {
        if (!date) return false;
        const selected = new Date(date);
        const selectedDateOnly = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).getTime();

        return finances.some(f => {
            const [sy, sm, sd] = f.start_date; // assuming [year, month, day]
            const [ey, em, ed] = f.end_date;

            const start = new Date(sy, sm - 1, sd).getTime();
            const end = new Date(ey, em - 1, ed).getTime();

            return selectedDateOnly >= start && selectedDateOnly <= end;
        });
    };


    const submitAdvance = async () => {
        if (!advanceDate || advanceDateError) return;

        try {
            await instance.post("/employee-advances", {
                employee_id: employeeId,
                amount: advanceAmount,
                date: advanceDate,
            });
            fetchFinances();
            setAdvanceAmount(0);
            setAdvanceDate("");
            setAdvanceDateError(null);
        } catch (err) {
            console.error("Failed to create finance", err);
        }
        closeAdvanceModal();
    };


    const fetchEmployee = async () => {
        try {
            const res = await instance.get(`/employees/${employeeId}`);
            if (res.status === HttpStatusCode.Ok) {
                setEmployee(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch employee:", err);
        }
    };

    const fetchFinances = async () => {
        try {
            const res = await instance.get(`/employee-finances`, {
                params: {employeeId, sort_by: sortBy, direction, page, size}
            });
            if (res.status === HttpStatusCode.Ok) {
                setFinances(res.data.content ?? []);
                setTotalPages(res.data.total_pages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch finances:", err);
        }
    };

    const handleCreate = async () => {
        const newErrors = {
            startDate: !newFinance.startDate, // true if empty
            endDate: !newFinance.endDate,
            incomeQFD: newFinance.incomeQFD === undefined || newFinance.incomeQFD < 0, // allow 0
            paidRef: newFinance.paidRef === undefined || newFinance.paidRef < 0, // allow 0
            percentQFD: newFinance.percentQFD === undefined || newFinance.percentQFD < 0, // allow 0
        };
        setErrors(newErrors);

        // Stop execution if there are errors
        if (Object.values(newErrors).some(Boolean)) {
            return; // do NOT close the row
        }
        try {
            await instance.post("/employee-finances", {
                employee_id: employeeId,
                start_date: newFinance.startDate,
                end_date: newFinance.endDate,
                income_qfd: Number(newFinance.incomeQFD),
                paid_ref: Number(newFinance.paidRef),
                percent_qfd: Number(newFinance.percentQFD),
            });
            setAdding(false);
            setNewFinance({
                startDate: "",
                endDate: "",
                employeeId: employeeId,
                incomeQFD: 0,
                paidRef: 0,
                percentQFD: 0
            });
            fetchFinances();
        } catch (err) {
            console.error("Failed to create finance", err);
        }
    };

    const handleEdit = (finance: EmployeeFinanceResponse) => {
        setEditingId(finance.id);
        setEditingFinance({
            startDate: formatBackendDate(finance.start_date),
            endDate: formatBackendDate(finance.end_date),
            incomeQFD: finance.income_qfd,
            paidRef: finance.paid_ref,
            percentQFD: finance.percent_qfd,
        });
    };

    const handleSave = async (id: number) => {
        try {
            await instance.put(`/employee-finances/${id}`, {
                start_date: editingFinance.startDate,
                end_date: editingFinance.endDate,
                income_qfd: editingFinance.incomeQFD,
                paid_ref: editingFinance.paidRef,
                percent_qfd: editingFinance.percentQFD,
            });
            setEditingId(null);
            fetchFinances();
        } catch (err) {
            console.error("Failed to update finance", err);
        }
    };

    const toggle = (i: number) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setDirection(direction === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setDirection("asc");
        }
        setPage(0);
    };

    const onPageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) setPage(newPage);
    };

    useEffect(() => {
        if (employeeId) {
            fetchEmployee();
            fetchFinances();
        }
    }, [employeeId, sortBy, direction, page]);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const formatBackendDate = (dateArray: number[]) => {
        if (!dateArray || !Array.isArray(dateArray)) return "";
        const [year, month, day] = dateArray;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const handleDelete = async (id: number) => {
        try {
            await instance.delete(`/employee-finances/${id}`);
            fetchFinances();
            setFinances(finances.filter(f => f.id !== id));
        } catch (err) {
            console.error("Failed to delete finance", err);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {isAdmin && <h1 className="text-4xl font-bold mb-4 text-center">Співробітник {employee?.name}</h1>}

            <div className="overflow-visible">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                    <tr className="bg-gray-800 text-white">
                        <th className="px-4 py-2 text-left w-62">Період</th>
                        <th
                            className="px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("incomeQFD")}
                        >
                            Дохід по QFD {sortBy === "incomeQFD" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("paidRef")}
                        >
                            Виплачено реф% {sortBy === "paidRef" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-2 text-left cursor-pointer"
                            onClick={() => handleSort("percentQFD")}
                        >
                            QFD (10% мінус реф%) {sortBy === "percentQFD" && (direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-4 py-2 text-left">Аванси</th>
                        <th className="w-12 px-4 py-2 text-left">
                            {isAdmin &&
                                <Plus
                                    size={20}
                                    className="text-gray-200 hover:text-indigo-400 cursor-pointer"
                                    onClick={() => setAdding(true)}
                                />
                            }
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {adding && (
                        <tr className="border-t border-gray-300 align-middle  transition">
                            {/* Start Date */}
                            <td className="px-2 py-1 flex flex-col">
                                <label>Початок</label>
                                <DatePicker
                                    selected={newFinance.startDate ? new Date(newFinance.startDate) : null}
                                    onChange={(startDate: Date | null) =>
                                        setNewFinance({
                                            ...newFinance,
                                            startDate: startDate ? formatDate(startDate) : ""
                                        })
                                    }
                                    dateFormat="yyyy-MM-dd"
                                    className={`w-full px-2 py-1 border rounded ${
                                        errors.startDate ? "border-red-800" : "border-gray-300"
                                    }`}/>
                            </td>

                            {/* End Date */}
                            <td className="px-2 py-1 flex flex-col">
                                <label>Кінець</label>
                                <DatePicker
                                    selected={newFinance.endDate ? new Date(newFinance.endDate) : null}
                                    onChange={(endDate: Date | null) =>
                                        setNewFinance({...newFinance, endDate: endDate ? formatDate(endDate) : ""})
                                    }
                                    dateFormat="yyyy-MM-dd"
                                    className={`w-full px-2 py-1 border rounded ${
                                        errors.endDate ? "border-red-800" : "border-gray-300"
                                    }`}/>
                            </td>
                            <td className="px-2 py-1">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={newFinance.incomeQFD}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*\.?\d*$/.test(value)) {
                                            setNewFinance({...newFinance, incomeQFD: value === "" ? 0 : Number(value)});
                                        }
                                    }}
                                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                        errors.incomeQFD ? "border-red-800" : "border-gray-300"
                                    }`}
                                />
                            </td>
                            <td className="px-2 py-1">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={newFinance.paidRef}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*\.?\d*$/.test(value)) {
                                            setNewFinance({...newFinance, paidRef: value === "" ? 0 : Number(value)});
                                        }
                                    }}
                                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                        errors.paidRef ? "border-red-800" : "border-gray-300"
                                    }`}
                                />
                            </td>
                            <td className="px-2 py-1">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={newFinance.percentQFD}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*\.?\d*$/.test(value)) {
                                            setNewFinance({
                                                ...newFinance,
                                                percentQFD: value === "" ? 0 : Number(value)
                                            });
                                        }
                                    }}
                                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                        errors.percentQFD ? "border-red-800" : "border-gray-300"
                                    }`}
                                />
                            </td>
                            <td className="px-2 py-1 align-middle">
                                <div className="flex items-center justify-center gap-2 h-full">
                                    {isAdmin &&
                                        <>
                                            <button
                                                onClick={handleCreate}
                                                className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500 flex items-center justify-center"
                                            >
                                                <Check size={20}/>
                                            </button>
                                            <button
                                                onClick={() => setAdding(false)}
                                                className="p-2 bg-red-950 text-white rounded hover:bg-red-800 flex items-center justify-center"
                                            >
                                                <X size={20}/>
                                            </button>
                                        </>
                                    }
                                </div>
                            </td>
                        </tr>
                    )}
                    {finances.length > 0 && finances.map((f, i) => (
                        <tr key={f.id} className="border-t border-gray-300">
                            {editingId === f.id ? (
                                <>
                                    {/* Start Date */}
                                    <td className="px-2 py-1 flex flex-col">
                                        <label>Початок</label>
                                        <DatePicker
                                            selected={editingFinance.startDate ? new Date(editingFinance.startDate) : null}
                                            onChange={(d) =>
                                                setEditingFinance({
                                                    ...editingFinance,
                                                    startDate: d ? formatDate(d) : ""
                                                })
                                            }
                                            dateFormat="yyyy-MM-dd"
                                            className="w-full px-2 py-1 border rounded"
                                        />
                                    </td>

                                    {/* End Date */}
                                    <td className="px-2 py-1 flex flex-col">
                                        <label>Кінець</label>
                                        <DatePicker
                                            selected={editingFinance.endDate ? new Date(editingFinance.endDate) : null}
                                            onChange={(d) =>
                                                setEditingFinance({...editingFinance, endDate: d ? formatDate(d) : ""})
                                            }
                                            dateFormat="yyyy-MM-dd"
                                            className="w-full px-2 py-1 border rounded"
                                        />
                                    </td>

                                    {/* Income QFD */}
                                    <td className="px-2 py-1">
                                        <input
                                            type="text"
                                            value={editingFinance.incomeQFD}
                                            onChange={(e) =>
                                                setEditingFinance({
                                                    ...editingFinance,
                                                    incomeQFD: Number(e.target.value)
                                                })
                                            }
                                            className="w-full px-2 py-1 border rounded"
                                        />
                                    </td>

                                    {/* Paid Ref */}
                                    <td className="px-2 py-1">
                                        <input
                                            type="text"
                                            value={editingFinance.paidRef}
                                            onChange={(e) =>
                                                setEditingFinance({...editingFinance, paidRef: Number(e.target.value)})
                                            }
                                            className="w-full px-2 py-1 border rounded"
                                        />
                                    </td>

                                    {/* Percent QFD */}
                                    <td className="px-2 py-1">
                                        <input
                                            type="text"
                                            value={editingFinance.percentQFD}
                                            onChange={(e) =>
                                                setEditingFinance({
                                                    ...editingFinance,
                                                    percentQFD: Number(e.target.value)
                                                })
                                            }
                                            className="w-full px-2 py-1 border rounded"
                                        />
                                    </td>

                                    {/* Advances */}
                                    <td className="px-4 py-2 relative text-left whitespace-nowrap">
                                        {f.advances.length !== 0 &&
                                            <button
                                                onClick={() => toggle(i)}
                                                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                                            >
                                                Показати ({f.advances.length})
                                            </button>
                                        }
                                        {openIndex === i && f.advances.length !== 0 && (
                                            <div
                                                className="absolute left-0 top-full mt-2 bg-gray-800 text-white rounded shadow-lg p-2 w-64 z-50"
                                            >
                                                {f.advances.map((a) => (
                                                    <div
                                                        key={a.id}
                                                        className="flex justify-between items-center px-2 py-1 border-b border-gray-700 last:border-none"
                                                    >
                                                        <span>
                                                          {a.amount} |{" "}
                                                            {new Date(a.date).toLocaleString("en-GB", {
                                                                year: "numeric",
                                                                month: "2-digit",
                                                                day: "2-digit",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                hour12: false,
                                                                timeZone: "Europe/Kiev",
                                                            })}
                                                        </span>
                                                        {isAdmin &&
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await instance.delete(`/employee-advances/${a.id}`);
                                                                        fetchFinances(); // обновляем таблицу
                                                                    } catch (err) {
                                                                        console.error("Failed to delete advance", err);
                                                                    }
                                                                }}
                                                                className="p-1 bg-red-700 hover:bg-red-600 text-white rounded ml-auto"
                                                            >
                                                                <Trash size={14}/>
                                                            </button>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-2 py-1 align-middle">
                                        <div className="flex items-center justify-center gap-2 h-full">
                                            {isAdmin &&
                                                <>
                                                    <button
                                                        onClick={() => handleSave(f.id)}
                                                        className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500"
                                                    >
                                                        <Check size={18}/>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-2 bg-red-950 text-white rounded hover:bg-red-800"
                                                    >
                                                        <X size={18}/>
                                                    </button>
                                                </>
                                            }
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-4 py-2">{formatBackendDate(f.start_date)} – {formatBackendDate(f.end_date)}</td>
                                    <td className="px-4 py-2">{f.income_qfd}</td>
                                    <td className="px-4 py-2">{f.paid_ref}</td>
                                    <td className="px-4 py-2">{f.percent_qfd}</td>
                                    <td className="px-4 py-2 relative text-left whitespace-nowrap">
                                        {f.advances.length !== 0 &&
                                            <button
                                                onClick={() => toggle(i)}
                                                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                                            >
                                                Показати ({f.advances.length})
                                            </button>}
                                        {openIndex === i && f.advances.length !== 0 && (
                                            <div
                                                className="absolute left-0 top-full mt-2 bg-gray-800 text-white rounded shadow-lg p-2 w-64 z-50"
                                            >
                                                {f.advances.map((a) => (
                                                    <div
                                                        key={a.id}
                                                        className="flex justify-between items-center px-2 py-1 border-b border-gray-700 last:border-none"
                                                    >
                                                        <span>
                                                          {a.amount} |{" "}
                                                            {new Date(a.date).toLocaleString("en-GB", {
                                                                year: "numeric",
                                                                month: "2-digit",
                                                                day: "2-digit",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                hour12: false,
                                                                timeZone: "Europe/Kiev",
                                                            })}
                                                        </span>
                                                        {isAdmin &&
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await instance.delete(`/employee-advances/${a.id}`);
                                                                        fetchFinances(); // обновляем таблицу
                                                                    } catch (err) {
                                                                        console.error("Failed to delete advance", err);
                                                                    }
                                                                }}
                                                                className="p-1 bg-red-700 hover:bg-red-600 text-white rounded ml-auto"
                                                            >
                                                                <Trash size={14}/>
                                                            </button>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </td>
                                    <td className="px-2 py-1 align-middle">
                                        <div className="flex items-center justify-center gap-2 h-full">
                                            {isAdmin &&
                                                <>
                                                    <button
                                                        className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500"
                                                        onClick={openAdvanceModal}
                                                    >
                                                        <Plus size={18}/>
                                                    </button>
                                                    <button onClick={() => handleEdit(f)}
                                                            className="p-2 bg-gray-700 text-white rounded hover:bg-indigo-500">
                                                        <Edit2 size={18}/>
                                                    </button>
                                                    <button onClick={() => handleDelete(f.id)}
                                                            className="p-2 bg-red-950 text-white rounded hover:bg-red-800">
                                                        <Trash size={18}/>
                                                    </button>
                                                </>
                                            }
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="mt-4 flex space-x-2 justify-center">
                    {page > 0 && (
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 0}
                            className="px-3 py-1 border rounded bg-gray-800 text-white disabled:opacity-50"
                        >
                            Минула
                        </button>)}
                    <span className="px-3 py-1">
                        Сторінка {finances.length === 0 ? 0 : page + 1} з {totalPages}
                    </span>
                    {page + 1 < totalPages && (
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page + 1 >= totalPages}
                            className="px-3 py-1 border rounded bg-gray-800 text-white disabled:opacity-50"
                        >
                            Наступна
                        </button>)}
                </div>
                {isAdvanceModalOpen && (
                    <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4">
                        <div
                            className="bg-gray-800 text-white p-6 rounded-md shadow-lg w-[300px] border border-gray-700"
                        >
                            <h2 className="text-xl font-semibold mb-4">Додати аванс</h2>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col">
                                    <label className="mb-1">Сума</label>
                                    <input
                                        type="text"
                                        value={advanceAmount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setAdvanceAmount(value === "" ? 0 : Number(value))
                                            }
                                        }}
                                        placeholder="0.00"
                                        className="px-3 py-2 rounded border border-gray-600  focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1">Дата та час</label>
                                    <DatePicker
                                        selected={advanceDate ? new Date(advanceDate) : null}
                                        onChange={(date: Date | null) => {
                                            const isoDate = date ? date.toISOString() : "";
                                            setAdvanceDate(isoDate);

                                            if (isoDate && !isAdvanceDateValid(isoDate)) {
                                                setAdvanceDateError("Обраний час не входить в період");
                                            } else {
                                                setAdvanceDateError(null);
                                            }
                                        }}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={1}
                                        dateFormat="yyyy-MM-dd HH:mm"
                                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={submitAdvance}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded transition"
                                    >
                                        Зберегти
                                    </button>
                                    <button
                                        onClick={closeAdvanceModal}
                                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded transition"
                                    >
                                        Відмінити
                                    </button>
                                </div>
                            </div>
                        </div>
                        {advanceDateError && (
                            <span className="text-red-500 text-sm mt-1">{advanceDateError}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
