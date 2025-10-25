import {jwtDecode } from "jwt-decode";

interface DecodedToken {
    exp: number;
    [key: string]: unknown;
}

export function isTokenValid(token: string): boolean {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        const now = Date.now() / 1000;
        return decoded.exp > now;
    } catch {
        return false;
    }
}