// /app/utils/auth.ts
"use client";

import { useState } from "react";

let loggedIn = false;

export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(loggedIn);

    const login = () => {
        loggedIn = true;
        setIsLoggedIn(true);
    };

    const logout = () => {
        loggedIn = false;
        setIsLoggedIn(false);
    };

    return { isLoggedIn, login, logout };
};
