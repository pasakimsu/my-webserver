"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, collection, doc, setDoc } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute"; // 로그인 보호 컴포넌트 추가

// 숫자를 한글 금액으로 변환하는 함수
const numberToKorean = (num: number): string => {
  const units = ["", "만", "억", "조"];
  let result = "";
  let unitIndex = 0;

  while (num > 0) {
    const part = num % 10000;
    if (part > 0) {
      result = `${part.toLocaleString()}${units[unitIndex]} ` + result;
    }
    num = Math.floor(num / 10000);
    unitIndex++;
  }

  return result.trim() + "원";
};

export default function BudgetPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, "0"));
  const [salary, setSalary] = useState<string>("");
  const [allocated, setAllocated] = useState({
    생활비: 0,
    적금: 0,
    투자: 0,
    가족: 0,
  });

  const accountNumbers = {
    생활비: "1000-8998-1075(토스)",
    적금: "1001-0319-4099(토스)",
    투자: "321-8556-5901(kb증권)",
    가족: "1000-8345-4263(토스)",
  };

  // 로그인 여부 확인
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId"); // 사용자 ID 저장
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  // 입력값 변경 시 천 단위 콤마(,) 적용 및 한글 변환
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, ""); // 기존 콤마 제거
    const numValue = Number(rawValue);

    if (!isNaN(numValue)) {
      setSalary(numValue.toLocaleString()); // 천 단위 콤마 추가
    }
  };

  const handleCalculate = () => {
    const rawSalary = Number(salary.replace(/,/g, ""));
    if (!rawSalary || rawSalary <= 0) return;

    setAllocated({
      생활비: Math.floor(rawSalary * 0.25),
      적금: Math.floor(rawSalary * 0.25),
      투자: Math.floor(rawSalary * 0.15),
      가족: Math.floor(rawSalary * 0.1),
    });
  };

  // Firebase에 데이터 저장
  const handleSave = async () => {
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    const rawSalary = Number(salary.replace(/,/g, ""));
    if (!rawSalary || rawSalary <= 0) {
      alert("올바른 월급을 입력하세요.");
      return;
    }

    try {
      const docRef = doc(db, "budgets", `${userId}_${year}-${month}`);
      await setDoc(docRef, {
        userId,
        year,
        month,
        salary: rawSalary,
        allocations: allocated,
        timestamp: new Date(),
      });

      alert("저장되었습니다.");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900">
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4 text-white">가계부 계산기</h2>

          {/* 년월 선택 */}
          <div className="flex gap-2 mb-3">
            <select
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}년</option>;
              })}
            </select>

            <select
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString().padStart(2, "0")}>
                  {m}월
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="월급을 입력하세요"
            className="w-full p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
            value={salary}
            onChange={handleSalaryChange}
          />
          {salary && (
            <p className="text-gray-400 text-sm mb-3">
              한글 금액: {numberToKorean(Number(salary.replace(/,/g, "")))}
            </p>
          )}

          <button
            onClick={handleCalculate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-300 mb-3"
          >
            계산하기
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded transition duration-300"
          >
            저장하기
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
