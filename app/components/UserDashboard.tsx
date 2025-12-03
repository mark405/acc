import React, {useEffect, useState} from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {EmployeeResponse} from "@/app/types";
import FinancesPage from "@/app/components/finances/FinancesPage";

export default function UserDashboard() {
    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);

    const fetchEmployee = async () => {
        try {
            const res = await instance.get("/employees/by_user");
            if (res.status === HttpStatusCode.Ok) {
                setEmployee(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch employee:", err);
        }
    };

    useEffect(() => {
        fetchEmployee();
    })

    if (!employee) return;
    return (<FinancesPage employeeId={employee.id}/>);
}
