type PaginationProps = {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages === 0) return null;

    return (
        <div className="flex items-center justify-center gap-4 mt-10">
            <button
                disabled={page === 0}
                onClick={() => onChange(page - 1)}
                className="px-5 py-2 rounded-xl bg-gray-800 text-white hover:scale-105 active:scale-95 transition"
            >
                Минула
            </button>

            <div className="px-4 py-2 text-sm">
                Сторінка <b>{page + 1}</b> з <b>{totalPages}</b>
            </div>

            <button
                disabled={page + 1 >= totalPages}
                onClick={() => onChange(page + 1)}
                className="px-5 py-2 rounded-xl bg-gray-800 text-white  hover:scale-105 active:scale-95 transition"
            >
                Наступна
            </button>
        </div>
    );
}
