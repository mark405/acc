interface TotalPanelProps {
    total: number;
}

export default function TotalPanel({ total }: TotalPanelProps) {
    return (
        <div className="text-white text-lg mt-4">
            Всього: {total}
        </div>
    );
}