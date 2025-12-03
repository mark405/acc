"use client";

import {KeyboardEvent, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Plus} from "lucide-react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";
import {useParams, useRouter} from "next/navigation";
import {BoardResponse, EmployeeResponse} from "@/app/types";

export default function Sidebar() {
    const params = useParams();
    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [boardsExpense, setBoardsExpense] = useState<BoardResponse[]>([]);
    const [boardsIncome, setBoardsIncome] = useState<BoardResponse[]>([]);
    const [collapsed, setCollapsed] = useState(true);
    const [showEmployees, setShowEmployees] = useState(false);
    const [showExpenses, setShowExpenses] = useState(false);
    const [showIncome, setShowIncome] = useState(false);

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

    const expenseInputRef = useRef<HTMLInputElement>(null);
    const incomeInputRef = useRef<HTMLInputElement>(null);

    const [contextMenu, setContextMenu] = useState<{ boardId: number; type: "EXPENSE" | "INCOME" } | null>(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

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
            let res = await instance.get("/employees", {params: {page: 0, size: 25}});
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
            const res = await instance.get(`/boards`, {params: {type}});
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
            const res = await instance.post(`/boards`, {name, type});
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
                            <Link href="/"
                                  className="text-2xl md:text-3xl font-extrabold hover:text-gray-300 transition">
                                Traffgun
                            </Link>
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
                                                href={`/expenses/${board.id}`}
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
                                                href={`/incomes/${board.id}`}
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
                            {showEmployees ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </div>

                        {/*{showEmployees && (*/}
                        {/*    <div className="pl-6">*/}
                        {/*        {employees.map((employee) => (*/}
                        {/*            <div key={employee.id}>*/}
                        {/*                <div*/}
                        {/*                    className="flex justify-between items-center px-6 py-2 cursor-pointer hover:bg-gray-700"*/}
                        {/*                >*/}
                        {/*                    <Link*/}
                        {/*                        href={`/employees/${employee.id}`}*/}
                        {/*                        className="block py-1 hover:text-white transition"*/}
                        {/*                    >*/}
                        {/*                        <span>{employee.name}</span>*/}
                        {/*                    </Link>*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        ))}*/}
                        {/*    </div>*/}
                        {/*)}*/}
                        {showEmployees && (
                            <div className="pl-6 text-gray-300">
                                {employees.map((employee) => (
                                    <Link
                                        key={employee.id}
                                        href={`/employees/${employee.id}`}
                                        className="flex justify-between items-center px-6 py-2 hover:bg-gray-700 transition"
                                    >
                                        <span>{employee.name}</span>
                                    </Link>
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
        </div>
    );
}
