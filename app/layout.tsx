"use client";

import './globals.css'
import AuthWrapper from "@/app/components/AuthWrapper";
import {AuthProvider} from "@/app/components/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="antialiased">
        <AuthProvider>
            <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
        </body>
        </html>
    );
}
