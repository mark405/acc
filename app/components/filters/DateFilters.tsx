"use client";

interface DateFiltersProps {
    startDate: string | "";
    setStartDate: (val: string) => void;
    endDate: string | "";
    setEndDate: (val: string) => void;
}

export default function DateFilters({ startDate, setStartDate, endDate, setEndDate }: Readonly<DateFiltersProps>) {
    return (
        <div className="flex flex-col space-y-1">
            <label className="text-white text-sm font-semibold">Дата</label>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
        </div>
    );
}
