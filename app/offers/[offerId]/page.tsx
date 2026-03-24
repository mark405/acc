"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {Edit3, Trash2} from "lucide-react";
import {OfferResponse} from "@/app/types";
import {OfferModal} from "@/app/components/OfferModal";
import {useAuth} from "@/app/components/AuthProvider";
import {DeleteModal} from "@/app/components/DeleteModal";

export default function OfferDetailsPage() {
    const router = useRouter();
    const offerId = useParams().offerId;

    const [offer, setOffer] = useState<OfferResponse | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const {user} = useAuth();
    const fetchOffer = async () => {
        if (!offerId) return;
        try {
            const res = await instance.get(`/offers/${offerId}`);
            setOffer(res.data);
        } catch (err) {
            console.error("Failed to fetch offer", err);
        }
    };

    useEffect(() => {
        fetchOffer();
    }, [offerId]);

    const handleDelete = async () => {
        if (!offerId) return;
        try {
            const res = await instance.delete(`/offers/${offerId}`);
            if (res.status === HttpStatusCode.NoContent) {
                router.push("/offers");
            }
        } catch (err) {
            console.error("Failed to delete offer", err);
        }
    };

    const handleEdit = () => {
        setIsOfferModalOpen(true);
    };

    if (!offerId) return <p>Offer ID is missing</p>;
    if (!offer) return <p>Loading...</p>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Офер #{offerId}</h1>
            <div className="border p-4 rounded shadow-md space-y-2">
                <p><strong>ID:</strong> {offer.id}</p>
                <p><strong>Name:</strong> {offer.name}</p>
                <p><strong>Geo:</strong> {offer.geo}</p>
                <p><strong>Source:</strong> {offer.source}</p>
                <p><strong>Description:</strong></p>
                <div className="border p-2 rounded bg-gray-50 whitespace-pre-wrap">{offer.description}</div>
                {user?.offers_editable && (
                    <div className="flex gap-2 mt-4">

                        <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded"
                                onClick={handleEdit}>
                            <Edit3 size={16}/> Редаугвати
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded"
                                onClick={() => setIsDeleteModalOpen(true)}>
                            <Trash2 size={16}/> Видалити
                        </button>

                    </div>
                )}
            </div>

            {isDeleteModalOpen && (

                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Ви впевнені, що хочете видалити?"
                />
            )}
            {(isOfferModalOpen && offerId) && (

                <OfferModal
                    isOpen={isOfferModalOpen}
                    onClose={() => setIsOfferModalOpen(false)}
                    onSaved={fetchOffer}
                    offerId={Number(offerId)}
                />
            )}
        </div>
    );
}