"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login"); // 첫 방문 시 로그인 페이지로 이동
  }, []);

  return null; // 화면에 아무것도 렌더링하지 않음
}
