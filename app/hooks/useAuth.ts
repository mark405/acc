"use client";

import { useState, useEffect } from "react";
import {isTokenValid} from "@/app/utils/authUtils";

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        if (typeof window === "undefined") return false;
        const token = localStorage.getItem("token");
        return token ? isTokenValid(token) : false;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem("token");
            setIsLoggedIn(token ? isTokenValid(token) : false);
        };

        window.addEventListener("storage", handleStorageChange);

        window.addEventListener("auth-change", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth-change", handleStorageChange);
        };
    }, []);

    return { isLoggedIn, setIsLoggedIn };
}

