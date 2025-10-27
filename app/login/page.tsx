"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {errorMessages} from "@/app/utils/errorUtils";
import {instance} from "@/app/api/instance";
import {HttpStatusCode} from "axios";
import {useAuth} from "@/app/components/AuthProvider";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const { checkAuth } = useAuth(); // get checkAuth from context

    const handleLogin = async () => {
        try {
            const res = await instance.post("/auth/login", { username, password });

            if (res.status != HttpStatusCode.Accepted) {
                setError(errorMessages[res.data.message] || res.data.message);
                return;
            }

            setError("");
            await checkAuth();
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-10 rounded-xl shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">
                    Авторизація
                </h1>

                <input
                    type="text"
                    placeholder="Логін"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 mb-4 rounded-md border border-gray-600 bg-gray-700 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 mb-4 rounded-md border border-gray-600 bg-gray-700 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />

                {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

                <button
                    onClick={handleLogin}
                    className="w-full bg-gray-700 hover:bg-gray-600 transition text-white font-semibold py-3 rounded-md mb-4 text-lg"
                >
                    Увійти
                </button>

                <p className="text-center text-gray-300 text-lg">
                   Ще не маєте акаунту?{" "}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
                        Зареєструватися
                    </Link>
                </p>
            </div>
        </div>
    );
}
