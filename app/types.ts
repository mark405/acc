export interface OperationResponse {
    id: number;
    amount: number;
    comment?: string;
    operation_type: "EXPENSE" | "INCOME";
    category: { id: number; name: string };
    date: string;
}

export interface CategoryResponse {
    id: number;
    name: string;
}
export interface BoardResponse {
    id: number;
    name: string;
    operation_type: "EXPENSE" | "INCOME";
}