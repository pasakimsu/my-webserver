"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      router.push("/login"); // 로그인 안 했으면 로그인 페이지로 이동
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) return null; // 로그인 여부 확인 중일 때 화면 깜빡임 방지

  return <>{children}</>;
}
