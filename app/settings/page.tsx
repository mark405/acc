"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { instance } from "@/app/api/instance";
import { useAuth } from "@/app/components/AuthProvider";

export default function SettingsPage() {
    const { user } = useAuth();
    const [totpEnabled, setTotpEnabled] = useState(false);
    const [qrUri, setQrUri] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const enableTotp = async () => {
        try {
            const res = await instance.post(`/auth/enable-totp?id=${user?.id}`);
            setMessage({ text: "", type: "success" });
            setQrUri(res.data);
        } catch (e) {
            setMessage({ text: "Failed to generate QR code.", type: "error" });
            console.error(e);
        }
    };

    const confirmTotp = async (code: string) => {
        try {
            await instance.post("/auth/verify-totp", { code, username: user?.username });
            setTotpEnabled(true);
            setQrUri("");
            setMessage({ text: "", type: "success" });
        } catch (e) {
            setMessage({ text: "Invalid TOTP code.", type: "error" });
        }
    };

    const disableTotp = async () => {
        try {
            await instance.post(`/auth/disable-totp?id=${user?.id}`);
            setTotpEnabled(false);
            setMessage({ text: "", type: "success" });
        } catch (e) {
            setMessage({ text: "Failed to disable 2FA.", type: "error" });
            console.error(e);
        }
    };

    useEffect(() => {
        if (user) {
            setTotpEnabled(user.totp_enabled);
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    Налаштування
                </h1>
                <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
                    <div className="space-y-2 text-gray-700">
                        <div><strong>ID:</strong> {user.id}</div>
                        <div><strong>Логін:</strong> {user.username}</div>
                        <div><strong>Роль:</strong> {user.role}</div>
                        <div><strong>Створений:</strong> {new Date(user.created_at).toLocaleString("en-GB", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                            timeZone: "Europe/Kiev",
                        })}</div>
                    </div>
                </div>
                {message && (
                    <div
                        className={`mb-4 px-4 py-2 rounded ${
                            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {!totpEnabled && !qrUri && (
                    <button
                        onClick={enableTotp}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
                    >
                        Увімкнути 2FA
                    </button>
                )}

                {qrUri && (
                    <div className="mt-6 text-center">
                        <p className="mb-4 text-gray-700">Скануй QR код за допомогою Google Authenticator:</p>
                        <QRCodeSVG value={qrUri} size={180} className="mx-auto mb-4" />
                        <p className="mb-2 text-gray-700">Введи 6-значний код знизу:</p>
                        <TotpForm onConfirm={confirmTotp} />
                    </div>
                )}

                {totpEnabled && (
                    <div className="mt-6 text-center">
                        <p className="text-gray-700 mb-4">
                            2FA зараз <strong>умівкнений</strong>.
                        </p>
                        <button
                            onClick={disableTotp}
                            className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition"
                        >
                            Вимкнути 2FA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function TotpForm({ onConfirm }: { onConfirm: (code: string) => void }) {
    const [code, setCode] = useState("");
    return (
        <div className="mt-2 flex justify-center gap-2">
            <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="border px-3 py-2 rounded-lg w-32 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
                onClick={() => onConfirm(code)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition"
            >
                Підтвердити
            </button>
        </div>
    );
}