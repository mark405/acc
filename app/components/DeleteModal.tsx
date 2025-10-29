"use client";

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
}

export const DeleteModal = ({ isOpen, onClose, onConfirm, title }: DeleteModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div
                className="bg-gray-800 text-white rounded shadow-lg p-6 w-96 pointer-events-auto"
            >
                <h2 className="text-lg  mb-4">{title}</h2>
                <div className="flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Скасувати
                    </button>
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                        onClick={onConfirm}
                    >
                        Так
                    </button>
                </div>
            </div>
        </div>
    );
};