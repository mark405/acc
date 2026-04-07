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
    projects: ProjectResponse[];
    offers_editable: boolean;
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
    role: string;
    user: UserResponse;
    columns: ColumnResponse[]
}

export interface ColumnResponse {
    id: number;
    name: string;
    index: number;
}

export interface ValueResponse {
    id: number;
    value: string;
    employee_column_id: number;
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
    advances: EmployeeAdvanceResponse[]
    values: ValueResponse[];
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

export interface OfferResponse {
    id: number;
    name: string;
    geo: string;
    source: string;
    description: string;
}

export interface NodeResponse {
    id: number;
    type: string;
    name: string;
    role: string;
    x: number;
    y: number;
    color: string;
}

export interface  EdgeResponse  {
    id: number;
    source: number;
    target: number;
    source_handle: string;
    target_handle: string;
}
