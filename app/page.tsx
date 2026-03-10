"use client";

import {useAuth} from "@/app/components/AuthProvider";
import AdminDashboard from "@/app/components/AdminDashboard";
import UserDashboard from "@/app/components/UserDashboard";
import TicketsPage from "@/app/tickets/page";
import ProjectsPage from "@/app/projects/page";

export default function Home() {
    // const {isAdmin, user} = useAuth();

    return <div>{<ProjectsPage/>}</div> ;

    // if (user?.role == "OFFERS_MANAGER")
    //     return (<TicketsPage/>)
    //
    // return <div>{isAdmin ? <AdminDashboard/> : <UserDashboard/>}</div>;
}
