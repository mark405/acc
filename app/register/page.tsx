"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {errorMessages} from "@/app/utils/errorUtils";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async () => {
        try {
            const res = await fetch("http://localhost:3002/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(errorMessages[data.message] || "Реєстрація не вдалася");
                return;
            }
            router.push("/login"); // redirect to login after registration
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-10 rounded-xl shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">
                    Register
                </h1>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 mb-4 rounded-md border border-gray-600 bg-gray-700 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 mb-4 rounded-md border border-gray-600 bg-gray-700 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />

                {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

                <button
                    onClick={handleRegister}
                    className="w-full bg-gray-700 hover:bg-gray-600 transition text-white font-semibold py-3 rounded-md mb-4 text-lg"
                >
                    Register
                </button>

                <p className="text-center text-gray-300 text-lg">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
