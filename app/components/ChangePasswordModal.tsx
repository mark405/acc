"use client";

import { useState } from "react";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string, confirmPassword: string) => void;
    title: string;
}

export const ChangePasswordModal = ({ isOpen, onClose, onConfirm, title }: ChangePasswordModalProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!password || !confirmPassword) {
            setError("Введіть обидва поля пароля");
            return;
        }

        if (password !== confirmPassword) {
            setError("Паролі не співпадають");
            return;
        }
        setError("");
        onConfirm(password, confirmPassword);
        setPassword("");
        setConfirmPassword("");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gray-800 text-white rounded shadow-lg p-6 w-96 pointer-events-auto">
                <h2 className="text-lg mb-4">{title}</h2>

                <div className="flex flex-col gap-3 mb-4">
                    <input
                        autoComplete="new-password"
                        type="password"
                        placeholder="Новий пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-400"
                        required
                    />
                    <input
                        autoComplete="new-password"
                        type="password"
                        placeholder="Підтвердити пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-400"
                        required
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Скасувати
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                        onClick={handleConfirm}
                    >
                        Змінити
                    </button>
                </div>
            </div>
        </div>
    );
};
