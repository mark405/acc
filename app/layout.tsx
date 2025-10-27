"use client";

import './globals.css'
import AuthWrapper from "@/app/components/AuthWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="antialiased">
        <AuthWrapper>{children}</AuthWrapper>
        </body>
        </html>
    );
}
