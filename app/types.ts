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
    employee: EmployeeResponse;
    type: string;
    body: string;
    date: number;
}

export interface EmployeeResponse {
    id: number;
    name: string;
    qfd: number;
    role: string;
    user: UserResponse;
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
    advances: EmployeeAdvanceResponse[]
}

export interface EmployeeAdvanceResponse {
    id: number;
    date: string;
    amount: number;
}

export interface TicketResponse {
    id: number;
    text: string;
    type: "TECH_GOAL" | "ADVERTISER_REQUEST";
    status: "OPENED" | "CLOSED" | "IN_PROGRESS";
    assigned_to: EmployeeResponse[];
    created_by: EmployeeResponse;
    operated_by?: EmployeeResponse;
    created_at: number;
    files: FileResponse[];
}

export interface FileResponse {
    id: number;
    file_name: string;
    file_url: string;
}

export interface CommentResponse {
    id: number;
    text: string;
    created_at: number;
    created_by: EmployeeResponse;
    attachments: FileResponse[];
}

export interface ProjectResponse {
    id: number;
    name: string;
    created_by: UserResponse;

}
