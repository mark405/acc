"use client";

import {KeyboardEvent, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Edit2, Plus, Trash2, UserCog} from "lucide-react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";
import {useParams, useRouter} from "next/navigation";
import {BoardResponse, EmployeeResponse, ProjectResponse, UserResponse} from "@/app/types";

export default function Sidebar() {
    const params = useParams();
    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [boardsExpense, setBoardsExpense] = useState<BoardResponse[]>([]);
    const [boardsIncome, setBoardsIncome] = useState<BoardResponse[]>([]);
    const [collapsed, setCollapsed] = useState(true);
    const [showEmployees, setShowEmployees] = useState(false);
    const [showExpenses, setShowExpenses] = useState(false);
    const [showIncome, setShowIncome] = useState(false);
    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [addingExpense, setAddingExpense] = useState(false);
    const [addingIncome, setAddingIncome] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [renamingBoard, setRenamingBoard] = useState<{
        id: number;
        type: "EXPENSE" | "INCOME";
        name: string
    } | null>(null);

    const {isLoggedIn, checkAuth} = useAuth();
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState("");
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const {isAdmin} = useAuth();
    const expenseInputRef = useRef<HTMLInputElement>(null);
    const incomeInputRef = useRef<HTMLInputElement>(null);
    const projectId = useParams().projectId;
    const [contextMenu, setContextMenu] = useState<{ boardId: number; type: "EXPENSE" | "INCOME" } | null>(null);
    const [renamingEmployee, setRenamingEmployee] = useState<{ id: number; name: string } | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeResponse | null>(null);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [employeeForRole, setEmployeeForRole] = useState<EmployeeResponse | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>("MANAGER");
// Function to open modal
    const confirmDeleteEmployee = (employee: EmployeeResponse) => {
        setEmployeeToDelete(employee);
        setDeleteModalOpen(true);
    };
    const openRoleDialog = (employee: EmployeeResponse) => {
        setEmployeeForRole(employee);
        setSelectedRole(employee.role ?? "MANAGER");
        setRoleDialogOpen(true);
    };
    const handleChangeRole = async () => {
        if (!employeeForRole) return;

        try {
            const res = await instance.put(
                `/employees/change-role/${employeeForRole.id}`,
                {role: selectedRole}
            );

            if (res.status === HttpStatusCode.NoContent) {
                setEmployees(prev =>
                    prev.map(emp =>
                        emp.id === employeeForRole.id
                            ? {...emp, role: selectedRole}
                            : emp
                    )
                );
            }
        } catch (err) {
            console.error("Failed to change role", err);
        } finally {
            setRoleDialogOpen(false);
            setEmployeeForRole(null);
        }
    };
// Function to actually delete
    const handleDeleteEmployee = async () => {
        if (!employeeToDelete) return;

        try {
            debugger;
            const res = await instance.delete(`/employees/${employeeToDelete.id}`);
            if (res.status === HttpStatusCode.NoContent) {
                // Remove from local state
                setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
            }
        } catch (err) {
            console.error("Failed to delete employee", err);
        } finally {
            setDeleteModalOpen(false);
            setEmployeeToDelete(null);
        }
    };
    const fetchUsers = async () => {
        try {
            const res = await instance.get("/users", {
                params: {project_id: projectId}
            });
            if (res.status === HttpStatusCode.Ok) {
                setUsers(res.data.content ?? []); // <- use .content
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const handleAddEmployee = async () => {
        if (!newEmployeeName.trim() || !selectedUserId) return;
        try {
            const res = await instance.post("/employees", {
                project_id: projectId,
                name: newEmployeeName.trim(),
                user_id: selectedUserId,
            });
            if (res.status === HttpStatusCode.Created || res.status === HttpStatusCode.Ok) {
                setModalOpen(false);
                setNewEmployeeName("");
                setSelectedUserId(null);
                // refetch employees
                const empRes = await instance.get(`/employees?project_id=${projectId}`);
                if (empRes.status === HttpStatusCode.Ok) setEmployees(empRes.data.content ?? []);
            }
        } catch (err) {
            console.error("Failed to add employee", err);
        }
    };
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);
    useEffect(() => {
        if (modalOpen) fetchUsers();
    }, [modalOpen]);
    const deleteBoard = async (id: number, type: "EXPENSE" | "INCOME") => {
        try {
            const res = await instance.delete(`/boards/${id}`);
            if (res.status === HttpStatusCode.NoContent) {
                await fetchBoards(type);
                if (params.boardId === id.toString()) {
                    router.push("/");
                }
            }
        } catch (err) {
            console.error("Failed to delete board", err);
        } finally {
            setContextMenu(null);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                addingExpense &&
                expenseInputRef.current &&
                !expenseInputRef.current.contains(target)
            ) {
                setAddingExpense(false);
                setNewBoardName("");
            }
            if (
                addingIncome &&
                incomeInputRef.current &&
                !incomeInputRef.current.contains(target)
            ) {
                setAddingIncome(false);
                setNewBoardName("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [addingExpense, addingIncome]);


    const fetchEmployees = async () => {
        try {
            let res = await instance.get("/employees", {params: {page: 0, size: 25, project_id: projectId}});
            if (res.status === HttpStatusCode.Forbidden) {
                await checkAuth();
                if (!isLoggedIn) router.replace("/login");
                res = await instance.get("/employees", {params: {page: 0, size: 25}});
            }
            setEmployees(res.data.content ?? []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    const fetchBoards = async (type: "EXPENSE" | "INCOME") => {
        try {
            const res = await instance.get(`/boards`, {params: {type, project_id: projectId}});
            if (res.status === HttpStatusCode.Ok || res.status === 200) {
                if (type === "EXPENSE") setBoardsExpense(res.data);
                else setBoardsIncome(res.data);
            }
        } catch (err) {
            console.error(`Failed to fetch boards for ${type}`, err);
        }
    };

    const createBoard = async (type: "EXPENSE" | "INCOME", name: string) => {
        try {
            const res = await instance.post(`/boards`, {project_id: projectId, name, type});
            if (res.status === HttpStatusCode.Ok || res.status === 200 || res.status === HttpStatusCode.Created) {
                await fetchBoards(type);
            }
        } catch (err) {
            console.error("Failed to create board", err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchEmployees();
            fetchBoards("EXPENSE");
            fetchBoards("INCOME");
            if (projectId) {
                const loadProject = async () => {
                    try {
                        const res = await instance.get("/projects/" + projectId);
                        if (res.status === HttpStatusCode.Ok || res.status === 200) {
                            setProject(res.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch projects", err);
                    }
                };

                loadProject();
            }
        }
    }, [isLoggedIn]);

    const handleAddBoard = (type: "EXPENSE" | "INCOME") => {
        setNewBoardName("");

        if (type === "EXPENSE") {
            setAddingExpense(true);
            setAddingIncome(false);
            setShowExpenses(true);
        } else {
            setAddingIncome(true);
            setAddingExpense(false);
            setShowIncome(true);
        }
    };


    const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>, type: "EXPENSE" | "INCOME") => {
        if (e.key === "Enter" && newBoardName.trim()) {
            await createBoard(type, newBoardName.trim());
            setNewBoardName("");
            if (type === "EXPENSE") setAddingExpense(false);
            else setAddingIncome(false);
        } else if (e.key === "Escape") {
            setNewBoardName("");
            setAddingExpense(false);
            setAddingIncome(false);
        }
    };

    const handleRenameKeyDown = async (
        e: KeyboardEvent<HTMLInputElement>,
        type: "EXPENSE" | "INCOME",
        id: number
    ) => {
        if (!renamingBoard) return;

        if (e.key === "Enter" && renamingBoard.name.trim()) {
            try {
                const res = await instance.put(`/boards/${id}`, {
                    name: renamingBoard.name.trim(),
                });

                if (res.status === HttpStatusCode.Ok) {
                    // Update the local state after successful rename
                    if (type === "EXPENSE") {
                        setBoardsExpense((prev) =>
                            prev.map((b) => (b.id === id ? {...b, name: renamingBoard.name.trim()} : b))
                        );
                    } else {
                        setBoardsIncome((prev) =>
                            prev.map((b) => (b.id === id ? {...b, name: renamingBoard.name.trim()} : b))
                        );
                    }
                }
            } catch (err) {
                console.error("Failed to rename board", err);
            } finally {
                setRenamingBoard(null);
            }
        } else if (e.key === "Escape") {
            setRenamingBoard(null);
        }
    };


    const sidebarWidth = collapsed ? 80 : 340;

    return (
        <div className="relative">
            <div
                className="fixed top-0 left-0 h-full bg-gray-800 text-white shadow-xl z-50 transition-all duration-300 flex flex-col"
                style={{width: `${sidebarWidth}px`}}
            >
                {/* Top header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-6 relative">
                    <div className={`flex items-center ${collapsed ? "justify-center w-full" : "space-x-3"}`}>
                        <Link
                            href="/"
                            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                        >
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9"/>
                            </svg>
                        </Link>

                        {!collapsed && (
                            <span className="text-2xl md:text-3xl font-extrabold text-white">
        {projectId == null ? "TRFFGN GROUP" : project?.name.toUpperCase()}
    </span>
                        )}
                    </div>
                </div>

                {!collapsed && <hr className="border-gray-600"/>}

                {!collapsed && (
                    <div className="flex-1 overflow-y-auto sidebar-scroll">
                        {/* === Витрати === */}
                        <div
                            className="px-6 py-3 text-lg font-semibold cursor-pointer hover:bg-gray-700 transition flex justify-between items-center"
                            onClick={() => setShowExpenses(!showExpenses)}
                        >
                            <span>Витрати</span>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddBoard("EXPENSE");
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-600 transition"
                                >
                                    <Plus size={18}/>
                                </button>
                                {showExpenses ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                        </div>

                        {showExpenses && (
                            <div className="pl-10 text-gray-300 text-base">
                                {boardsExpense.map((board) => (
                                    <div key={board.id} className="relative">
                                        {renamingBoard?.id === board.id && renamingBoard.type === "EXPENSE" ? (
                                            <input
                                                type="text"
                                                value={renamingBoard.name}
                                                onChange={(e) => setRenamingBoard(prev => prev ? {
                                                    ...prev,
                                                    name: e.target.value
                                                } : prev)}
                                                onKeyDown={(e) => handleRenameKeyDown(e, "EXPENSE", board.id)}
                                                autoFocus
                                                className="w-[85%] bg-gray-700 text-white px-2 py-1 rounded mt-1 outline-none"
                                            />
                                        ) : (
                                            <Link
                                                href={`/projects/${projectId}/expenses/${board.id}`}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    if (board.level_type === "MAIN") return;
                                                    setContextMenu({boardId: board.id, type: "EXPENSE"});
                                                }}
                                                onDoubleClick={() => setRenamingBoard({
                                                    id: board.id,
                                                    type: "EXPENSE",
                                                    name: board.name
                                                })}
                                                className="block py-1 hover:text-white transition"
                                            >
                                                {board.name}
                                            </Link>
                                        )}
                                        {contextMenu?.boardId === board.id && contextMenu.type === "EXPENSE" && (
                                            <div
                                                className="absolute right-0 mt-1 bg-gray-700 text-white rounded shadow-md w-36 z-[1000]">
                                                <button
                                                    onClick={() => {
                                                        setRenamingBoard({
                                                            id: board.id,
                                                            type: "EXPENSE",
                                                            name: board.name
                                                        });
                                                        setContextMenu(null);
                                                    }}
                                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-800 transition"
                                                >
                                                    Редагувати
                                                </button>
                                                <button
                                                    onClick={() => deleteBoard(board.id, "EXPENSE")}
                                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-red-600 transition"
                                                >
                                                    Видалити
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {addingExpense && (
                                    <input
                                        ref={expenseInputRef}
                                        type="text"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, "EXPENSE")}
                                        placeholder="Назва таблиці..."
                                        autoFocus
                                        className="w-[85%] bg-gray-700 text-white px-2 py-1 rounded mt-1 outline-none"
                                    />
                                )}
                            </div>
                        )}

                        {/* === Доходи === */}
                        <div
                            className="px-6 py-3 text-lg font-semibold cursor-pointer hover:bg-gray-700 transition flex justify-between items-center"
                            onClick={() => setShowIncome(!showIncome)}
                        >
                            <span>Доходи</span>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddBoard("INCOME");
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-600 transition"
                                >
                                    <Plus size={18}/>
                                </button>
                                {showIncome ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                        </div>

                        {showIncome && (
                            <div className="pl-10 text-gray-300 text-base">
                                {boardsIncome.map((board) => (
                                    <div key={board.id} className="relative">
                                        {renamingBoard?.id === board.id && renamingBoard.type === "INCOME" ? (
                                            <input
                                                type="text"
                                                value={renamingBoard.name}
                                                onChange={(e) =>
                                                    setRenamingBoard(prev => prev ? {
                                                        ...prev,
                                                        name: e.target.value
                                                    } : prev)
                                                }
                                                onKeyDown={(e) => handleRenameKeyDown(e, "INCOME", board.id)}
                                                autoFocus
                                                className="w-[85%] bg-gray-700 text-white px-2 py-1 rounded mt-1 outline-none"
                                            />
                                        ) : (
                                            <Link
                                                href={`/projects/${projectId}/incomes/${board.id}`}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    if (board.level_type === "MAIN") return;
                                                    setContextMenu({boardId: board.id, type: "INCOME"});
                                                }}
                                                className="block py-1 hover:text-white transition"
                                            >
                                                {board.name}
                                            </Link>
                                        )}

                                        {/* Context menu */}
                                        {contextMenu?.boardId === board.id && contextMenu.type === "INCOME" && (
                                            <div
                                                className="absolute right-0 mt-1 bg-gray-700 text-white rounded shadow-md w-36 z-[1000]">
                                                <button
                                                    onClick={() => {
                                                        setRenamingBoard({
                                                            id: board.id,
                                                            type: "INCOME",
                                                            name: board.name
                                                        });
                                                        setContextMenu(null);
                                                    }}
                                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-800 transition"
                                                >
                                                    Редагувати
                                                </button>
                                                <button
                                                    onClick={() => deleteBoard(board.id, "INCOME")}
                                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-red-600 transition"
                                                >
                                                    Видалити
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}


                                {addingIncome && (
                                    <input
                                        ref={incomeInputRef}
                                        type="text"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, "INCOME")}
                                        placeholder="Назва таблиці..."
                                        autoFocus
                                        className="w-[85%] bg-gray-700 text-white px-2 py-1 rounded mt-1 outline-none"
                                    />
                                )}
                            </div>
                        )}
                        {/* === Співробітники === */}
                        <div
                            className="px-6 py-3 text-lg font-semibold cursor-pointer hover:bg-gray-700 transition flex justify-between items-center"
                            onClick={() => setShowEmployees(!showEmployees)}
                        >
                            <span>Співробітники</span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModalOpen(true);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-600 transition"
                                >
                                    <Plus size={18}/>
                                </button>
                                {showEmployees ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                        </div>

                        {showEmployees && (
                            <div className=" text-gray-300">
                                {employees.map((employee) => (
                                    <div key={employee.id}
                                         className="flex justify-between items-center px-6 py-2 hover:bg-gray-700 transition">
                                        {/* Name / Editable input */}
                                        {renamingEmployee?.id === employee.id ? (
                                            <input
                                                type="text"
                                                value={renamingEmployee.name}
                                                onChange={(e) =>
                                                    setRenamingEmployee(prev => prev ? {
                                                        ...prev,
                                                        name: e.target.value
                                                    } : prev)
                                                }
                                                onKeyDown={async (e) => {
                                                    if (e.key === "Enter" && renamingEmployee.name.trim()) {
                                                        try {
                                                            await instance.put(`/employees/${employee.id}`, {name: renamingEmployee.name.trim()});
                                                            setEmployees(prev =>
                                                                prev.map(emp => emp.id === employee.id ? {
                                                                    ...emp,
                                                                    name: renamingEmployee.name.trim()
                                                                } : emp)
                                                            );
                                                        } catch (err) {
                                                            console.error("Failed to rename employee", err);
                                                        } finally {
                                                            setRenamingEmployee(null);
                                                        }
                                                    } else if (e.key === "Escape") {
                                                        setRenamingEmployee(null);
                                                    }
                                                }}
                                                autoFocus
                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded outline-none"
                                            />
                                        ) : (
                                            <Link
                                                key={employee.id}
                                                href={`/projects/${projectId}/employees/${employee.id}`}
                                                className="block w-full"
                                            >
                                                <span>{employee.user.id} {employee.name} ({employee.role})</span>
                                            </Link>
                                        )}

                                        {/* Edit / Delete buttons */}
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setRenamingEmployee({
                                                    id: employee.id,
                                                    name: employee.name
                                                })}
                                                className="px-2 py-1 text-sm rounded bg-gray-600 hover:bg-gray-500 transition"
                                            >
                                                <Edit2 size={16}/>
                                            </button>
                                            {employee.role !== "ADMIN" && (


                                                <button
                                                    onClick={() => openRoleDialog(employee)}
                                                    className="px-2 py-1 text-sm rounded bg-blue-600 hover:bg-blue-500 transition"
                                                >
                                                    <UserCog size={16}/>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => confirmDeleteEmployee(employee)}
                                                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                )}
            </div>

            <button
                onClick={() => setCollapsed(!collapsed)}
                className="fixed top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 ease-in-out z-50"
                style={{
                    left: collapsed ? `${sidebarWidth}px` : `${sidebarWidth - 16}px`,
                }}
            >
                {collapsed ? <ArrowRight size={24}/> : <ArrowLeft size={24}/>}
            </button>
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 text-white rounded-lg p-6 w-80 relative">
                        <h2 className="text-lg font-bold mb-4">Додати співробітника</h2>

                        <input
                            type="text"
                            placeholder="Ім'я"
                            value={newEmployeeName}
                            onChange={(e) => setNewEmployeeName(e.target.value)}
                            className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white outline-none"
                        />

                        <select
                            value={selectedUserId ?? ""}
                            onChange={(e) => setSelectedUserId(Number(e.target.value))}
                            className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white outline-none"
                        >
                            <option value="" disabled>Виберіть користувача</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.id} {user.username}</option>
                            ))}
                        </select>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleAddEmployee}
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition"
                            >
                                Додати
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 text-white rounded-lg p-6 w-80">
                        <h2 className="text-lg font-bold mb-4">Видалити співробітника?</h2>
                        <p className="mb-4">Ви впевнені, що хочете видалити {employeeToDelete?.name}?</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleDeleteEmployee}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 transition"
                            >
                                Видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {roleDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 text-white rounded-lg p-6 w-80">
                        <h2 className="text-lg font-bold mb-4">Змінити роль</h2>

                        <p className="mb-3">
                            Роль співробітника: {employeeForRole?.role}
                        </p>

                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white outline-none"
                        >
                            <option value="MANAGER">MANAGER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OFFERS_MANAGER">Offers Manager</option>
                            <option value="TECH_MANAGER">Tech Manager</option>
                            <option value="HEAD_OF_AFFILIATE">Head Of Affiliate</option>
                        </select>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setRoleDialogOpen(false)}
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition"
                            >
                                Скасувати
                            </button>

                            <button
                                onClick={handleChangeRole}
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition"
                            >
                                Зберегти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
