import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {instance} from "@/app/api/instance";

type TotalPanelProps = {
    boardId: number;
    type: string;
};

export default function TotalPanel({ boardId, type }: TotalPanelProps) {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [total, setTotal] = useState<number | null>(null);

    const fetchTotal = async () => {
        if (!startDate || !endDate) return;

        try {
            const res = await instance.get("/stats/total", {
                params: {
                    board_id: boardId,
                    type: type,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                },
            });

            setTotal(res.data);
        } catch (err) {
            console.error("Failed to fetch total", err);
        }
    };

    return (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-white">
            <div className="flex gap-4 items-center">
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    placeholderText="Початок"
                    className="px-2 py-1 rounded bg-gray-700"
                />

                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    placeholderText="Кінець"
                    className="px-2 py-1 rounded bg-gray-700"
                />

                <button
                    onClick={fetchTotal}
                    className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded"
                >
                    Отримати тотал
                </button>
            </div>

            {total !== null && (
                <div className="mt-4 text-lg">
                    Тотал: <span className="font-bold">{total}</span>
                </div>
            )}
        </div>
    );
}