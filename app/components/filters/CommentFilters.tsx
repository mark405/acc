"use client";

interface CommentFilterProps {
    commentFilter: string;
    setCommentFilter: (val: string) => void;
}

export default function CommentFilter({ commentFilter, setCommentFilter }: Readonly<CommentFilterProps>) {
    return (
        <div className="flex flex-col space-y-1 mb-4">
            <label className="text-white text-sm font-semibold">Коментар</label>
            <input
                type="text"
                value={commentFilter}
                onChange={(e) => setCommentFilter(e.target.value)}
                placeholder="Коментар..."
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
        </div>
    );
}
