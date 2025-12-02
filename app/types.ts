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
    startDate: string;
    endDate: string;
    incomeQFD: number;
    paidRef: number;
    percentQFD: number;
    advances: [EmployeeAdvanceResponse]
}

export interface EmployeeAdvanceResponse {
    id: number;
    date: string;
    amount: number;
}