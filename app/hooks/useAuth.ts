"use client";

import { useState, useEffect } from "react";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    const checkAuth = async () => {
        try {
            let res = await instance.get("/users/me");
            if (res.status === HttpStatusCode.Ok) {
                setIsLoggedIn(true);
                return;
            }

            res = await instance.post("/auth/refresh");
            if (res.status === HttpStatusCode.Ok) {
                setIsLoggedIn(true);
                return;
            }

            setIsLoggedIn(false);
        } catch {
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        checkAuth();

        // Listen to auth-change events
        const handler = () => checkAuth();
        window.addEventListener("auth-change", handler);
        return () => window.removeEventListener("auth-change", handler);
    }, []);

    return { isLoggedIn, setIsLoggedIn };
}