"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../utils/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(); // sets the auth state
        router.push("/"); // redirect to main page
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-10 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-3xl text-white font-bold mb-6 text-center">Login</h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />

                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 transition text-white py-2 rounded font-semibold mt-2"
                    >
                        Login
                    </button>
                </form>

                <p className="text-gray-300 mt-4 text-center">
                    If you don’t have an account,{" "}
                    <a href="/register" className="text-blue-400 hover:underline">
                        register here
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
