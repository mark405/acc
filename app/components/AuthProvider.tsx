import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { HttpStatusCode } from "axios";
import {instance} from "@/app/api/instance";

interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthContextType {
    isLoggedIn: boolean | null;
    user: User | null;
    isAdmin: boolean;
    setUser: (u: User | null) => void;
    setIsLoggedIn: (b: boolean) => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const fetchUser = async (): Promise<User | null> => {
        try {
            const res = await instance.get("/users/me");
            if (res.status === HttpStatusCode.Ok && res.data) {
                return res.data;
            }
        } catch {}
        return null;
    };

    const checkAuth = async () => {
        setIsLoggedIn(null); // start loading
        const currentUser = await fetchUser();

        if (currentUser) {
            setUser(currentUser);
            setIsLoggedIn(true);
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
    };

    const isAdmin = user?.role === "ADMIN";

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, isAdmin, setUser, setIsLoggedIn, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use the context
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
