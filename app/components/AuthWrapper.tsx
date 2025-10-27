"use client";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {useAuth} from "@/app/hooks/useAuth";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

interface AuthWrapperProps {
    children: ReactNode;
}

const publicPages = ["/login", "/register"];

export default function AuthWrapper({ children }: AuthWrapperProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoggedIn === null) return; // still loading

        if (!isLoggedIn && !publicPages.includes(pathname)) router.replace("/login");
    }, [isLoggedIn, pathname, router]);

    if (isLoggedIn === null) return <div>Loading...</div>;

    // Public pages → no Navbar/Sidebar
    if (publicPages.includes(pathname)) return <>{children}</>;

    // Protected pages → show layout
    return (
        <>
            <Navbar />
            <Sidebar />
            {children}
        </>
    );
}
