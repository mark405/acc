"use client";

import { useState } from "react";
import {useRouter} from "next/navigation";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter(); // initialize router

    const handleRegister = async () => {
        try {
            const res = await fetch("http://localhost:3002/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                throw new Error("Registration failed");
            }

            const data = await res.json();

            router.push("/");

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto mt-20 border rounded">
            <h1 className="text-2xl mb-4">Register</h1>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border p-2 mb-2 w-full"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 mb-2 w-full"
            />
            {error && <p className="text-red-500">{error}</p>}
            <button
                onClick={handleRegister}
                className="bg-green-500 text-white p-2 rounded w-full"
            >
                Register
            </button>
        </div>
    );
}
