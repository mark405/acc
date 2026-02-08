"use client";

import React, { useState, useEffect } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (role: string) => void;
    currentRole?: string;
    roles: string[];
    title: string;
};

export function ChangeRoleModal({ isOpen, onClose, onConfirm, currentRole, roles, title }: Props) {
    const [selectedRole, setSelectedRole] = useState(currentRole || "");

    useEffect(() => {
        setSelectedRole(currentRole || "");
    }, [currentRole]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gray-800 text-white rounded shadow-lg p-6 w-80 pointer-events-auto border border-gray-700">
                <h2 className="text-lg font-bold mb-4">{title}</h2>

                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="border border-gray-400 px-2 py-1 mb-4 w-full bg-gray-700 text-white rounded"
                >
                    {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>

                <div className="flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-400 text-white"
                        onClick={onClose}
                    >
                        Відміна
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-white"
                        onClick={() => onConfirm(selectedRole)}
                    >
                        Змінити
                    </button>
                </div>
            </div>
        </div>
    );
}