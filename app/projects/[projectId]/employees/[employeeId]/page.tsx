"use client";

import React from "react";
import {useParams} from "next/navigation";
import "react-datepicker/dist/react-datepicker.css";
import EmployeeFinancesPage from "@/app/components/salary/EmployeeFinancesPage";

export default function EmployeePage() {
    const params = useParams();
    const employeeId = Number(params.employeeId);
    return (<EmployeeFinancesPage employeeId={employeeId}/>);
}
