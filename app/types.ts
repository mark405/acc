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

export interface UserResponse {
    id: number;
    username: string;
    role: string;
    created_at: number;
    modified_at: number;
}

export interface HistoryResponse {
    id: number;
    user: UserResponse;
    type: string;
    body: string;
    date: number;
}

export interface EmployeeResponse {
    id: number;
    name: string;
}

export interface BoardResponse {
    id: number;
    name: string;
    operation_type: "EXPENSE" | "INCOME";
    level_type: "MAIN" | "CUSTOM";
}

export interface EmployeeFinanceResponse {
    id: number;
    start_date: number[];
    end_date: number[];
    income_qfd: number;
    paid_ref: number;
    percent_qfd: number;
    advances: [EmployeeAdvanceResponse]
}

export interface EmployeeAdvanceResponse {
    id: number;
    date: string;
    amount: number;
}