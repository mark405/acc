// "use client";
//
// import { useState, useEffect } from "react";
// import {instance} from "@/app/api/instance";
// import {HttpStatusCode} from "axios";
//
// export function useAuth() {
//     const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
//     const [user, setUser] = useState<{id: number; username: string; role: string } | null>(null);
//
//
//     const checkAuth = async () => {
//         try {
//             let res = await instance.get("/users/me");
//             if (res.status === HttpStatusCode.Ok) {
//                 setIsLoggedIn(true);
//                 setUser(res.data);
//                 return;
//             }
//
//             res = await instance.post("/auth/refresh");
//             if (res.status === HttpStatusCode.Ok) {
//                 const userRes = await instance.get("/users/me");
//                 if (userRes.status === HttpStatusCode.Ok) {
//                     setIsLoggedIn(true);
//                     setUser(userRes.data);
//                     return;
//                 }
//             }
//
//             setIsLoggedIn(false);
//             setUser(null);
//         } catch {
//             setIsLoggedIn(false);
//             setUser(null);
//         }
//     };
//
//     useEffect(() => {
//         checkAuth();
//     }, []);
//
//     return { isLoggedIn, user, setUser, setIsLoggedIn };
// }