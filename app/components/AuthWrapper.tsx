"use client";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import {useAuth} from "@/app/components/AuthProvider";

interface AuthWrapperProps {
    children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
    const { isLoggedIn, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicPages = ["/login", "/register"];

    useEffect(() => {
        if (isLoggedIn === false && !publicPages.includes(pathname)) {
            router.replace("/login");
        }
    }, [isLoggedIn, pathname, router]);

    if (isLoggedIn === null) {
        // Still loading
        return;
    }

    if (publicPages.includes(pathname)) return <>{children}</>;

    return (
        <>
            <Navbar />
            {isAdmin && <Sidebar />}
            {children}
        </>
    );
}
