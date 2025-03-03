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
        // Firestore에서 데이터가 정상적으로 조회됨 → 로그인 성공
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", userId); // 로그인된 사용자 저장
        router.push("/budget"); // 가계부 페이지로 이동
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      setError("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4 text-white">로그인</h2>
        <input
          type="text"
          placeholder="아이디"
          className="w-full p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
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
