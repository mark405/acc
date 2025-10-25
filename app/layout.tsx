"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import { useAuth } from "@/app/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checkingAuth, setCheckingAuth] = useState(true);

    const publicPages = ["/login", "/register"];

    useEffect(() => {
        // Skip auth check for public pages
        if (publicPages.includes(pathname)) {
            setCheckingAuth(false);
            return;
        }

        // Wait until useAuth determines login state
        const token = localStorage.getItem("token");
        const valid = !!token; // Or use isTokenValid(token)

        if (!valid) {
            router.replace("/login"); // redirect without pushing history
        }

        setCheckingAuth(false);
    }, [pathname, router]);

    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {checkingAuth ? (
            <p className="text-center mt-20">Loading...</p>
        ) : (
            <>
                {isLoggedIn && !publicPages.includes(pathname) && (
                    <>
                        <Navbar />
                        <Sidebar />
                    </>
                )}
                {children}
            </>
        )}
        </body>
        </html>
    );
}
