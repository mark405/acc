"use client";

import React from "react";
import {useParams} from "next/navigation";
import "react-datepicker/dist/react-datepicker.css";
import FinancesPage from "@/app/components/finances/FinancesPage";

export default function EmployeePage() {
    const params = useParams();
    const employeeId = Number(params.employeeId);
    return (<FinancesPage employeeId={employeeId}/>);
}
