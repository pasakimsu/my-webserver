"use client";

import { useState } from "react";
import { db, collection, getDocs, query, where } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setError("");

    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("userId", "==", userId), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        localStorage.setItem("isLoggedIn", "true"); // 로그인 상태 저장
        router.push("/budget"); // 로그인 후 가계부 페이지로 이동
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      setError("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">로그인</h2>
        <input
          type="text"
          placeholder="아이디"
          className="w-full p-3 mb-3 border border-gray-400 rounded"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-3 mb-3 border border-gray-400 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-300"
        >
          로그인
        </button>
      </div>
    </div>
  );
}
