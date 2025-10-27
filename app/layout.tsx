"use client";

import './globals.css'
import {useEffect, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {useAuth} from "@/app/hooks/useAuth";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";


export default function RootLayout({children}: { children: React.ReactNode }) {
    const {isLoggedIn} = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checkingAuth, setCheckingAuth] = useState(true);

    const publicPages = ["/login", "/register"];

    useEffect(() => {
        if (isLoggedIn === null) return;

        if (!publicPages.includes(pathname) && !isLoggedIn) {
            router.replace("/login");
        }

        setCheckingAuth(false);
    }, [isLoggedIn, pathname, router]);

    return (
        <html lang="en">
        <body className="antialiased">
        {checkingAuth ? null : isLoggedIn && !publicPages.includes(pathname) && (
            <>
                <Navbar/>
                <Sidebar/>
            </>
        )}
        {children}
        </body>
        </html>
    );
}
