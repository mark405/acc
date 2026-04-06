"use client";


import {OfferModal} from "@/app/components/OfferModal";
import {DeleteModal} from "@/app/components/DeleteModal";
import Pagination from "@/app/components/Pagination";
import {Edit3, Eye, Trash2} from "lucide-react";
import {useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {OfferResponse} from "@/app/types";
import {useRouter} from "next/navigation";
import {useAuth} from "@/app/components/AuthProvider";

export default function OfferPage() {
    const [offers, setOffers] = useState<OfferResponse[]>([]);
    const [name, setName] = useState("");
    const [geo, setGeo] = useState("");
    const [source, setSource] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [direction, setDirection] = useState("asc");
    const [page, setPage] = useState(0);
    const [size] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const {user} = useAuth();
    const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const router = useRouter();
    const fetchOffers = async () => {
        try {
            const params = {
                name: name || undefined,
                geo: geo || undefined,
                source: source || undefined,
                sort_by: sortBy,
                direction,
                page,
                size
            };
            const res = await instance.get("/offers", {params});
            setOffers(res.data.content);
            setTotalPages(res.data.total_pages);
        } catch (err) {
            console.error("Failed to fetch offers", err);
        }
    };

    useEffect(() => {
        setPage(0);
    }, [name, geo, source]);

    useEffect(() => {
        fetchOffers();
    }, [name, geo, source, sortBy, direction, page]);

    const handleSort = (field: string) => {
        if (sortBy === field) setDirection(direction === "asc" ? "desc" : "asc");
        else {
            setSortBy(field);
            setDirection("asc");
        }
    };

    const handleDelete = (id: number) => {
        setSelectedOfferId(id);
        setIsDeleteModalOpen(true);
    };
    const handleEdit = (id: number) => {
        setSelectedOfferId(id);
        setIsOfferModalOpen(true);
    };
    const handleCreate = () => {
        setSelectedOfferId(null);
        setIsOfferModalOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedOfferId === null) return;
        try {
            await instance.delete(`/offers/${selectedOfferId}`);
            fetchOffers();
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedOfferId(null);
        }
    };

    return (
        <div className="p-4 max-w-6xl mx-auto scale-[0.95] origin-top">
            <h1 className="text-white text-4xl font-bold mb-4 text-center">Офери</h1>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-4 justify-center text-white">
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)}
                       className="border rounded px-2 py-1 text-white border-white"/>
                <input type="text" placeholder="Geo" value={geo} onChange={e => setGeo(e.target.value)}
                       className="border rounded px-2 py-1 text-white"/>
                <input type="text" placeholder="Source" value={source} onChange={e => setSource(e.target.value)}
                       className="border rounded px-2 py-1 text-white"/>
                <button onClick={handleCreate} className="px-3 py-1 bg-green-600 text-white rounded">Створити оффер
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse border border-gray-300 text-white">
                    <thead>
                    <tr className="bg-gray-800 text-white">
                        {["id", "name", "geo", "source"].map(f =>
                            <th key={f}
                                className="w-1/6 px-4 py-2 text-left cursor-pointer" onClick={() => handleSort(f)}>
                                {f.toUpperCase()} {sortBy === f && (direction === "asc" ? "↑" : "↓")}
                            </th>
                        )}
                        <th className="w-1/6 px-4 py-2">Дії</th>
                    </tr>
                    </thead>
                    <tbody>
                    {offers.map(o => (
                        <tr key={o.id} className="border-t border-gray-300">
                            <td className="px-4 py-2">{o.id}</td>
                            <td className="px-4 py-2">{o.name}</td>
                            <td className="px-4 py-2">{o.geo}</td>
                            <td className="px-4 py-2">{o.source}</td>
                            <td className="px-4 py-2">
                                <div className="flex gap-2 items-center justify-center">
                                    <Eye
                                        size={18}
                                        className="cursor-pointer text-green-600 hover:text-green-400"
                                        onClick={() => router.push(`/offers/${o.id}`)}
                                    />
                                    {user?.offers_editable && (
                                        <>
                                            <Edit3
                                                size={18}
                                                className="cursor-pointer text-blue-600 hover:text-blue-400"
                                                onClick={() => handleEdit(o.id)}
                                            />
                                            <Trash2
                                                size={18}
                                                className="cursor-pointer text-red-600 hover:text-red-400"
                                                onClick={() => handleDelete(o.id)}
                                            />
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination page={page} totalPages={totalPages} onChange={setPage}/>

            {isDeleteModalOpen && (
                <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
                             onConfirm={confirmDelete} title="Видалити цей оффер?"/>
            )}
            {isOfferModalOpen && (
                <OfferModal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)}
                            onSaved={fetchOffers} offerId={selectedOfferId}/>
            )}

        </div>
    );
}
