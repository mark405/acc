"use client";

import React, { useEffect, useState } from "react";
import { instance } from "@/app/api/instance";
import {OfferResponse} from "@/app/types";

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
        debugger;
        if (offerId) {
            instance.get(`/offers/${offerId}`).then(res => {
                debugger;
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

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl font-bold mb-4">{offerId ? "Edit Offer" : "Create Offer"}</h2>
                <input className="border px-2 py-1 w-full mb-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                <input className="border px-2 py-1 w-full mb-2" placeholder="Geo" value={geo} onChange={e => setGeo(e.target.value)} />
                <input className="border px-2 py-1 w-full mb-2" placeholder="Source" value={source} onChange={e => setSource(e.target.value)} />
                <textarea
                    className="border px-2 py-2 w-full mb-2 h-64 resize-y" // h-64 = 16rem tall
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
                    <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded">{offerId ? "Save" : "Create"}</button>
                </div>
            </div>
        </div>
    );
}