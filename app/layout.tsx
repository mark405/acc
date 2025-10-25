"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { useAuth } from "@/app/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {isTokenValid} from "@/app/utils/authUtils";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checkingAuth, setCheckingAuth] = useState(true);

    const publicPages = ["/login", "/register"];
    useEffect(() => {
        // Use a microtask to avoid "sync setState" warning
        Promise.resolve().then(() => {
            if (publicPages.includes(pathname)) {
                setCheckingAuth(false);
                return;
            }

            const token = localStorage.getItem("token");
            const valid = token ? isTokenValid(token) : false;

            if (!valid) {
                localStorage.removeItem("token");
                router.replace("/login");
            }

            setCheckingAuth(false);
        });
    }, [pathname, router]);

    if (checkingAuth) {
        return (
            <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            </body>
            </html>
        );
    }

    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {isLoggedIn && !publicPages.includes(pathname) && (
            <>
                <Navbar />
                <Sidebar />
            </>
        )}
        {children}
        </body>
        </html>
    );
}
