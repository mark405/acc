"use client";

import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useEffect, useState} from "react";
import {ProjectResponse} from "@/app/types";
import {useAuth} from "@/app/components/AuthProvider";
import {useRouter} from "next/navigation";
import Link from "next/link";

export default function ProjectsPage() {
    const {isAdmin} = useAuth();
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [newProjectName, setNewProjectName] = useState("");
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: ProjectResponse } | null>(null);
    const router = useRouter();
    const handleClick = (projectId: string) => {
        router.push(`/projects/${projectId}`);
    };
    // Modal state
    const [editModal, setEditModal] = useState<{ project: ProjectResponse; name: string } | null>(null);
    const [deleteModal, setDeleteModal] = useState<ProjectResponse | null>(null);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const res = await instance.get("/projects");
                if (res.status === HttpStatusCode.Ok || res.status === 200) {
                    setProjects(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
        };

        loadProjects();
    }, []);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        try {
            const res = await instance.post("/projects", {name: newProjectName});
            if (res.status === HttpStatusCode.Ok || res.status === 200) {
                setProjects((prev) => [...prev, res.data]);
                setNewProjectName(""); // reset input
            }
        } catch (err) {
            console.error("Failed to create project", err);
        }
    };

    const handleEditSave = async () => {
        if (!editModal) return;
        try {
            const res = await instance.put(`/projects/${editModal.project.id}`, {name: editModal.name});
            if (res.status === HttpStatusCode.Ok) {
                setProjects((prev) =>
                    prev.map((p) => (p.id === editModal.project.id ? res.data : p))
                );
                setEditModal(null);
            }
        } catch (err) {
            console.error("Failed to update project", err);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal) return;
        try {
            const res = await instance.delete(`/projects/${deleteModal.id}`);
            if (res.status === HttpStatusCode.NoContent) {
                setProjects((prev) => prev.filter((p) => p.id !== deleteModal.id));
                setDeleteModal(null);
            }
        } catch (err) {
            console.error("Failed to delete project", err);
        }
    };

    const handleRightClick = (e: React.MouseEvent, project: ProjectResponse) => {
        if (!isAdmin) return;
        e.preventDefault();
        setContextMenu({x: e.clientX, y: e.clientY, project});
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div className="p-6 bg-gray-800 min-h-screen flex flex-col items-center" onClick={closeContextMenu}>
            <h1 className="text-4xl font-bold mb-8 text-white">Проекти</h1>

            {isAdmin && (
                <div className="mb-8 flex gap-3 items-center w-full max-w-2xl">
                    <input
                        type="text"
                        placeholder="Назва нового проекту"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="p-3 rounded border border-gray-600 flex-1 text-lg bg-gray-700 text-white placeholder-gray-400"
                    />
                    <button
                        onClick={handleCreateProject}
                        className="bg-purple-700 text-white px-6 py-3 rounded hover:bg-purple-800 transition text-lg"
                    >
                        Створити проект
                    </button>
                </div>
            )}

            {/* Projects Grid */}
            <div className="w-full flex flex-col gap-8">
                {Array.from({length: Math.ceil(projects.length / 3)}).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-flow-col auto-cols-max gap-8 justify-center">
                        {projects
                            .slice(rowIndex * 3, rowIndex * 3 + 3)
                            .map((project) => (
                                <Link key={project.id} href={`/projects/${project.id}`}>
                                    <div
                                        key={project.id}
                                        onContextMenu={(e) => handleRightClick(e, project)}
                                        className="relative overflow-hidden rounded-2xl shadow-2xl p-12 text-white w-120 min-h-[300px] flex flex-col justify-between cursor-pointer"
                                    >
                                        {/* Animated gradient background */}
                                        <div
                                            className="absolute inset-0 z-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-gradient"></div>

                                        <h2 className="text-3xl font-bold relative z-10">{project.name}</h2>
                                        <p className="mt-6 text-xl relative z-10 text-gray-200">Створив {project.created_by.username}</p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                ))}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    style={{top: contextMenu.y, left: contextMenu.x}}
                    className="absolute bg-gray-800 shadow-lg border border-gray-600 z-50 text-white rounded-xl"
                >
                    <button
                        className="block px-4 py-2 hover:bg-gray-700 w-full text-left rounded-t-xl"
                        onClick={() => {
                            setEditModal({project: contextMenu.project, name: contextMenu.project.name});
                            closeContextMenu();
                        }}
                    >
                        Edit
                    </button>
                    <button
                        className="block px-4 py-2 hover:bg-gray-700 w-full text-left text-red-400 rounded-b-xl"
                        onClick={() => {
                            setDeleteModal(contextMenu.project);
                            closeContextMenu();
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30"
                     onClick={() => setEditModal(null)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 text-white">Edit Project</h2>
                        <input
                            type="text"
                            value={editModal.name}
                            onChange={(e) => setEditModal({...editModal, name: e.target.value})}
                            className="border border-gray-600 rounded p-2 w-full mb-4 bg-gray-700 text-white placeholder-gray-400"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
                                onClick={() => setEditModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-800 text-white"
                                onClick={handleEditSave}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30"
                     onClick={() => setDeleteModal(null)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 text-white">Delete Project</h2>
                        <p className="mb-4 text-gray-300">Ви впевнені, що хочете видалити {deleteModal.name}?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
                                onClick={() => setDeleteModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDeleteConfirm}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}