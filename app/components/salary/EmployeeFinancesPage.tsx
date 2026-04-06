"use client";

import React, {useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {ColumnResponse, EmployeeFinanceResponse, EmployeeResponse} from "@/app/types";
import {Check, Edit2, ListPlus, Plus, Trash, X} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import Pagination from "@/app/components/Pagination";
import {useParams} from "next/navigation";
import {closestCenter, DndContext} from "@dnd-kit/core";
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
type SortableColumnProps = {
    column: ColumnResponse;
    isAdmin: boolean;
    openEditColumnModal: (col: ColumnResponse) => void;
    setColumnToDelete: (col: ColumnResponse) => void;
};
function SortableColumn({
                            column,
                            isAdmin,
                            openEditColumnModal,
                            setColumnToDelete
                        }: SortableColumnProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({id: column.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className="px-4 py-2 text-left group"
        >
            <div className="flex items-center gap-2">

                {/* Drag handle (important) */}
                <span
                    {...attributes}
                    {...listeners}
                    className="cursor-grab select-none"
                >
                    {column.name}
                </span>

                {/* Your controls go HERE */}
                {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Edit2
                            size={14}
                            className="cursor-pointer hover:text-indigo-400"
                            onClick={() => openEditColumnModal(column)}
                        />
                        <Trash
                            size={14}
                            className="cursor-pointer hover:text-red-400"
                            onClick={() => setColumnToDelete(column)}
                        />
                    </div>
                )}
            </div>
        </th>
    );
}

export default function EmployeeFinancesPage({employeeId}: { employeeId: number }) {
    const [isAdmin, setAdmin] = useState<true | false>(false)
    const [projectEmployee, setProjectEmployee] = useState<EmployeeResponse | null>(null);
    const [columns, setColumns] = useState<ColumnResponse[]>([]);
    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
    const [finances, setFinances] = useState<EmployeeFinanceResponse[]>([]);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [conditions, setConditions] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [conditionsOpen, setConditionsOpen] = useState(false);
    const [conditionsDraft, setConditionsDraft] = useState(conditions);
    const [sortBy, setSortBy] = useState<string>("id");
    const [direction, setDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState<number>(0);
    const [size] = useState<number>(15); // количество записей на страницу
    const [totalPages, setTotalPages] = useState<number>(1);
    const [errors, setErrors] = useState<{
        startDate?: boolean;
        endDate?: boolean;
    }>({});
    const [financeToDelete, setFinanceToDelete] = useState<EmployeeFinanceResponse | null>(null);
    const [columnToDelete, setColumnToDelete] = useState<ColumnResponse | null>(null);
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);
    const [columnName, setColumnName] = useState("");
    const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
    const openAddColumnModal = () => {
        setColumnName("");
        setEditingColumnId(null);
        setColumnModalOpen(true);
    };
    const openEditColumnModal = (col: ColumnResponse) => {
        setColumnName(col.name);
        setEditingColumnId(col.id);
        setColumnModalOpen(true);
    };
    const [adding, setAdding] = useState(false);
    const [newFinance, setNewFinance] = useState({
        startDate: "",
        endDate: "",
        employeeId: employeeId,
        values: {} as Record<number, string>
    });
    const fetchConditions = async () => {
        try {
            const res = await instance.get(`/employees/${employeeId}/conditions`);
            setConditions(res.data || "");
            setConditionsDraft(res.data || "");
        } catch (err) {
            console.error("Failed to fetch conditions", err);
        }
    };
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingFinance, setEditingFinance] = useState({
        startDate: "" as string,
        endDate: "" as string,
        values: {} as Record<number, string>
    });
    const projectId = useParams().projectId;
    const [isAdvanceModalOpen, setAdvanceModalOpen] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [advanceDate, setAdvanceDate] = useState("");
    const [advanceDateError, setAdvanceDateError] = useState<string | null>(null);

    const openAdvanceModal = () => setAdvanceModalOpen(true);
    const closeAdvanceModal = () => setAdvanceModalOpen(false);
    const confirmDeleteFinance = async () => {
        if (!financeToDelete) return;

        try {
            await instance.delete(`/employee-finances/${financeToDelete.id}`);
            setFinances(prev => prev.filter(f => f.id !== financeToDelete.id));
            fetchFinances();
        } catch (err) {
            console.error("Failed to delete finance", err);
        } finally {
            setFinanceToDelete(null);
        }
    };
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
                setAdmin(res.data?.role == 'ADMIN')
                setColumns(res.data.columns);
            }
        } catch (err) {
            console.error("Failed to fetch employee:", err);
        }
    };

    const fetchEmployeeByUser = async () => {
        try {
            const res = await instance.get("/employees/by_user/" + projectId);
            if (res.status === HttpStatusCode.Ok) {
                setProjectEmployee(res.data);
                setAdmin(res.data.role == 'ADMIN')
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
        };
        setErrors(newErrors);

        // Stop execution if there are errors
        if (Object.values(newErrors).some(Boolean)) {
            return; // do NOT close the row
        }
        try {
            const valuesPayload = Object.entries(newFinance.values).map(
                ([columnId, value]) => ({
                    column_id: Number(columnId),
                    value
                })
            );
            await instance.post("/employee-finances", {
                employee_id: employeeId,
                start_date: newFinance.startDate,
                end_date: newFinance.endDate,
                project_id: projectId,
                values: valuesPayload
            });
            setAdding(false);
            setNewFinance({
                startDate: "",
                endDate: "",
                employeeId: employeeId,
                values: {}
            });
            fetchFinances();
        } catch (err) {
            console.error("Failed to create finance", err);
        }
    };

    const handleEdit = (finance: EmployeeFinanceResponse) => {
        setEditingId(finance.id);
        const valuesMap: Record<number, string> = {};
        finance.values.forEach(v => {
            valuesMap[v.employee_column_id] = v.value;
        });
        setEditingFinance({
            startDate: formatBackendDate(finance.start_date),
            endDate: formatBackendDate(finance.end_date),
            values: valuesMap
        });
    };

    const handleSave = async (finance: EmployeeFinanceResponse) => {
        try {
            const valuesPayload = Object.entries(editingFinance.values).map(
                ([columnId, value]) => ({
                    id: finance.values.find(v => v.employee_column_id === Number(columnId))?.id,
                    column_id: Number(columnId),
                    value
                })
            );
            await instance.put(`/employee-finances/${finance.id}`, {
                start_date: editingFinance.startDate,
                end_date: editingFinance.endDate,
                values: valuesPayload
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

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeByUser();
            fetchEmployee();
            fetchFinances();
            fetchConditions();
        }
    }, [employeeId, sortBy, direction, page]);
    const saveConditions = async () => {
        try {
            await instance.post(`/employees/${employeeId}/conditions`, {
                text: conditionsDraft
            });
            setConditions(conditionsDraft);
        } catch (err) {
            console.error("Failed to save conditions", err);
        }
    };
    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-CA"); // yyyy-MM-dd

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

    const saveColumn = async () => {
        if (!columnName.trim()) return;

        try {
            if (editingColumnId) {
                await instance.put(`/employees/${editingColumnId}/columns`, {
                    name: columnName,
                    index: columns.find(c => c.id === editingColumnId)?.index,
                });
            } else {
                const nextIndex =
                    columns.length > 0
                        ? Math.max(...columns.map(c => c.index)) + 1
                        : 1;
                await instance.post(`/employees/${employeeId}/columns`, {
                    name: columnName,
                    index: nextIndex
                });
            }

            setColumnModalOpen(false);
            setColumnName("");
            setEditingColumnId(null);
            fetchEmployeeByUser();
            fetchEmployee();

        } catch (err) {
            console.error("Failed to save column", err);
        }
    };

    const confirmDeleteColumn = async () => {
        if (!columnToDelete) return;

        try {
            const deletedIndex = columnToDelete.index;

            // 1. Delete column
            await instance.delete(`/employees/${columnToDelete.id}/columns`);

            // 2. Shift remaining columns
            const updatedColumns = columns
                .filter(c => c.id !== columnToDelete.id)
                .map(c => {
                    if (c.index > deletedIndex) {
                        return { ...c, index: c.index - 1 };
                    }
                    return c;
                });

            setColumns(updatedColumns);

            // 3. Sync with backend
            await Promise.all(
                updatedColumns.map(col =>
                    instance.put(`/employees/${col.id}/columns`, {
                        name: col.name,
                        index: col.index
                    })
                )
            );

            fetchEmployeeByUser();
            fetchEmployee();

        } catch (err) {
            console.error("Failed to delete column", err);
        } finally {
            setColumnToDelete(null);
        }
    };

    const handleDragEnd = async (event: any) => {
        const {active, over} = event;

        if (!over || active.id === over.id) return;

        const oldIndex = columns.findIndex(c => c.id === active.id);
        const newIndex = columns.findIndex(c => c.id === over.id);

        const newColumns = arrayMove(columns, oldIndex, newIndex)
            .map((col, i) => ({
                ...col,
                index: i + 1
            }));

        setColumns(newColumns);

        // send to backend
        try {
            await Promise.all(
                newColumns.map(col =>
                    instance.put(`/employees/${col.id}/columns`, {
                        name: col.name,
                        index: col.index
                    })
                )
            );
        } catch (e) {
            console.error("Failed to reorder columns", e);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {isAdmin &&
                <h1 className="text-4xl font-bold mb-4 text-center text-white">Співробітник {employee?.name}</h1>}

            <div className="overflow-visible">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>

                    <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                        <tr className="bg-gray-800 text-white">
                            <th className="px-4 py-2 text-left w-62">Період</th>
                            <SortableContext
                                items={columns.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {[...columns]
                                    .sort((a, b) => a.index - b.index)
                                    .map(col => (
                                        <SortableColumn key={col.id} column={col} isAdmin={isAdmin}
                                                        openEditColumnModal={openEditColumnModal}
                                                        setColumnToDelete={setColumnToDelete}/>
                                    ))}
                            </SortableContext>
                            <th className="px-4 py-2 text-left">Аванси</th>
                            <th className="w-12 px-4 py-2 text-left">
                                {isAdmin && (
                                    <div className="flex items-center gap-2">
                                        <ListPlus
                                            size={20}
                                            className="cursor-pointer hover:text-indigo-400"
                                            onClick={openAddColumnModal}
                                        />
                                        <Plus
                                            size={20}
                                            className="text-gray-200 hover:text-indigo-400 cursor-pointer"
                                            onClick={() => setAdding(true)}
                                        />
                                    </div>
                                )}
                            </th>
                        </tr>
                        </thead>
                        <tbody>

                        {adding && (
                            <tr className="border-t border-gray-300 align-middle  transition">
                                {/* Start Date */}
                                <td className="px-2 py-1 flex flex-col text-white">
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
                                <td className="px-2 py-1 flex flex-col text-white">
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
                                {[...columns]
                                    .sort((a, b) => a.index - b.index)
                                    .map(col => (
                                        <td key={col.id} className="px-2 py-1">
                                            <input
                                                type="number"
                                                value={newFinance.values[col.id] || undefined}
                                                onChange={(e) =>
                                                    setNewFinance(prev => ({
                                                        ...prev,
                                                        values: {
                                                            ...prev.values,
                                                            [col.id]: e.target.value
                                                        }
                                                    }))
                                                }
                                                className="w-full px-2 py-1 border rounded bg-gray-800 text-white"
                                            />
                                        </td>
                                    ))}
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
                                        <td className="px-2 py-1 flex flex-col text-white">
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
                                        <td className="px-2 py-1 flex flex-col text-white">
                                            <label>Кінець</label>
                                            <DatePicker
                                                selected={editingFinance.endDate ? new Date(editingFinance.endDate) : null}
                                                onChange={(d) =>
                                                    setEditingFinance({
                                                        ...editingFinance,
                                                        endDate: d ? formatDate(d) : ""
                                                    })
                                                }
                                                dateFormat="yyyy-MM-dd"
                                                className="w-full px-2 py-1 border rounded"
                                            />
                                        </td>
                                        {[...columns]
                                            .sort((a, b) => a.index - b.index)
                                            .map(col => (
                                                <td key={col.id} className="px-2 py-1">
                                                    <input
                                                        type="number"
                                                        value={editingFinance.values[col.id]}
                                                        onChange={(e) =>
                                                            setEditingFinance(prev => ({
                                                                ...prev,
                                                                values: {
                                                                    ...prev.values,
                                                                    [col.id]: e.target.value
                                                                }
                                                            }))
                                                        }
                                                        className="w-full px-2 py-1 border rounded bg-gray-800 text-white"
                                                    />
                                                </td>
                                            ))}
                                        {/* Actions */}
                                        <td className="px-2 py-1 align-middle text-white">
                                            <div className="flex items-center justify-center gap-2 h-full">
                                                {isAdmin &&
                                                    <>
                                                        <button
                                                            onClick={() => handleSave(f)}
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
                                        <td className="px-4 py-2 text-white">{formatBackendDate(f.start_date)} – {formatBackendDate(f.end_date)}</td>
                                        {columns.map(col => {
                                            const cell = f.values.find(v => v.employee_column_id === col.id);

                                            return (
                                                <td key={col.id} className="px-4 py-2 text-white ">
                                                    {cell?.value}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-2 relative text-left whitespace-nowrap text-white">
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
                                                    <div
                                                        className="flex justify-between items-center px-2 py-1 font-bold">
                                                        <span>Сума:</span>
                                                        <span>
                                                        {f.advances.reduce((sum, a) => sum + a.amount, 0)}
                                                    </span>
                                                    </div>
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
                                                        <button onClick={() => setFinanceToDelete(f)}
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
                </DndContext>
                <div className="mt-6 mb-4 border border-gray-700 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div
                        className="bg-gray-800 text-white px-4 py-3 cursor-pointer flex justify-between items-center hover:bg-gray-750"
                        onClick={() => setConditionsOpen(!conditionsOpen)}
                    >
        <span className="font-semibold text-sm tracking-wide">
            Умови
        </span>
                        <span className="text-xs">
            {conditionsOpen ? "▲" : "▼"}
        </span>
                    </div>

                    {/* Body */}
                    {conditionsOpen && (
                        <div className="bg-gray-900 text-white p-4 flex flex-col gap-4">

                            {/* Textarea */}
                            <textarea
                                value={conditionsDraft}
                                onChange={(e) => isEditing && setConditionsDraft(e.target.value)}
                                readOnly={!isEditing}
                                className={`w-full h-64 p-3 border border-gray-600 rounded-md bg-gray-800 text-white resize-none transition-all
                    ${isEditing
                                    ? "cursor-text focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    : "cursor-default opacity-80"
                                }
                `}
                                placeholder={isEditing ? "Введіть умови..." : ""}
                            />

                            {/* Footer actions */}
                            <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-700">

                                {isAdmin && !isEditing && (
                                    <button
                                        onClick={() => {
                                            setConditionsDraft(conditions);
                                            setIsEditing(true);
                                        }}
                                        className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-md transition"
                                    >
                                        Редагувати
                                    </button>
                                )}

                                {isAdmin && isEditing && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setConditionsDraft(conditions);
                                                setIsEditing(false);
                                            }}
                                            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition"
                                        >
                                            Скасувати
                                        </button>

                                        <button
                                            onClick={() => {
                                                saveConditions();
                                                setIsEditing(false);
                                            }}
                                            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-md transition"
                                        >
                                            Зберегти
                                        </button>
                                    </>
                                )}

                            </div>
                        </div>
                    )}
                </div>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                />
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
                {isColumnModalOpen && (
                    <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4">
                        <div
                            className="bg-gray-800 text-white p-6 rounded-md shadow-lg w-[300px] border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4">
                                {editingColumnId ? "Редагувати колонку" : "Додати колонку"}
                            </h2>

                            <input
                                type="text"
                                value={columnName}
                                onChange={(e) => setColumnName(e.target.value)}
                                placeholder="Назва"
                                className="w-full px-3 py-2 mb-4 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={saveColumn}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded"
                                >
                                    Зберегти
                                </button>
                                <button
                                    onClick={() => setColumnModalOpen(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
                                >
                                    Відмінити
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {columnToDelete && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 ">
                        <div
                            className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-[320px] border border-gray-700">
                            <h2 className="text-lg mb-4">
                                Ви впевнені, що хочете видалити колонку{" "}
                                <span className="font-bold text-white">
                    {columnToDelete.name}
                </span>?
                            </h2>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setColumnToDelete(null)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                                >
                                    Скасувати
                                </button>

                                <button
                                    onClick={confirmDeleteColumn}
                                    className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
                                >
                                    Видалити
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {financeToDelete && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-[320px] border border-gray-700">
                            <h2 className="text-lg mb-4">
                                Ви впевнені, що хочете видалити цей фінансовий запис?
                            </h2>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setFinanceToDelete(null)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                                >
                                    Скасувати
                                </button>

                                <button
                                    onClick={confirmDeleteFinance}
                                    className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
                                >
                                    Видалити
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
