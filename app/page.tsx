"use client";

import { useAuth } from "@/app/components/AuthProvider";
import AdminDashboard from "@/app/components/AdminDashboard";
import UserDashboard from "@/app/components/UserDashboard";

export default function Home() {
  const { isAdmin } = useAuth();

  return <div>{isAdmin ? <AdminDashboard /> : <UserDashboard />}</div>;
}
