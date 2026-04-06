"use client";

import React, { useEffect, useState } from "react";
import { instance } from "@/app/api/instance";
import {OfferResponse} from "@/app/types";
import {createPortal} from "react-dom";

interface OfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    offerId: number | null;
}

export function OfferModal({ isOpen, onClose, onSaved, offerId }: OfferModalProps) {
    const [name, setName] = useState("");
    const [geo, setGeo] = useState("");
    const [source, setSource] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (offerId) {
            instance.get(`/offers/${offerId}`).then(res => {
                const o: OfferResponse = res.data;
                setName(o.name);
                setGeo(o.geo);
                setSource(o.source);
                setDescription(o.description);
            });
        } else {
            setName(""); setGeo(""); setSource(""); setDescription("");
        }
    }, [offerId]);

    const handleSave = async () => {
        try {
            if (offerId) {
                await instance.put(`/offers/${offerId}`, { name, geo, source, description });
            } else {
                await instance.post("/offers", { name, geo, source, description });
            }
            onSaved();
            onClose();
        } catch (err) {
            console.error("Failed to save offer", err);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center ">
            <div className="max-h-[90vh] overflow-y-auto
            bg-gray-900 text-white p-6 rounded-xl w-96 shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">
                    {offerId ? "Редагувати Оффер" : "Створити Оффер"}
                </h2>

                <input
                    className="border border-indigo-600 bg-gray-800 text-white px-2 py-1 w-full mb-2 rounded"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                <input
                    className="border border-indigo-600 bg-gray-800 text-white px-2 py-1 w-full mb-2 rounded"
                    placeholder="Geo"
                    value={geo}
                    onChange={e => setGeo(e.target.value)}
                />

                <input
                    className="border border-indigo-600 bg-gray-800 text-white px-2 py-1 w-full mb-2 rounded"
                    placeholder="Source"
                    value={source}
                    onChange={e => setSource(e.target.value)}
                />

                <textarea
                    className="border border-indigo-600 bg-gray-800 text-white px-2 py-2 w-full mb-2 h-64 resize-y rounded"
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />

                <div className="flex justify-end gap-2 mt-3">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 border border-gray-600 rounded hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                    >
                        {offerId ? "Save" : "Create"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}