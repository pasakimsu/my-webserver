"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, doc, setDoc } from "@/lib/firebase";
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
  const [allowance, setAllowance] = useState<string>(""); // 5일 수당
  const [salary, setSalary] = useState<string>(""); // 20일 월급
  const [totalSalary, setTotalSalary] = useState<number>(0); // 합산 금액
  const [allocated, setAllocated] = useState<{ [key: string]: number }>({
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

  // 로그인 여부 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  // 입력값 변경 시 천 단위 콤마(,) 적용 및 합산 금액 업데이트
  const handleAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    const numValue = Number(rawValue);
    if (!isNaN(numValue)) {
      setAllowance(numValue.toLocaleString());
      updateTotalSalary(numValue, salary);
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    const numValue = Number(rawValue);
    if (!isNaN(numValue)) {
      setSalary(numValue.toLocaleString());
      updateTotalSalary(allowance, numValue);
    }
  };

  // 5일 수당 + 20일 월급 합산
  const updateTotalSalary = (allowanceValue: string | number, salaryValue: string | number) => {
    const rawAllowance = Number(typeof allowanceValue === "string" ? allowanceValue.replace(/,/g, "") : allowanceValue);
    const rawSalary = Number(typeof salaryValue === "string" ? salaryValue.replace(/,/g, "") : salaryValue);
    setTotalSalary(rawAllowance + rawSalary);
  };

  // 월급 분배 계산
  const handleCalculate = () => {
    if (totalSalary <= 0) return;

    setAllocated({
      생활비: Math.floor(totalSalary * 0.25),
      적금: Math.floor(totalSalary * 0.25),
      투자: Math.floor(totalSalary * 0.15),
      가족: Math.floor(totalSalary * 0.1),
    });
  };

  // Firebase에 데이터 저장
  const handleSave = async () => {
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (totalSalary <= 0) {
      alert("올바른 수당과 월급을 입력하세요.");
      return;
    }

    try {
      const docRef = doc(db, "budgets", `${userId}_${year}-${month}`);
      await setDoc(docRef, {
        userId,
        year,
        month,
        allowance: Number(allowance.replace(/,/g, "")), // 5일 수당
        salary: Number(salary.replace(/,/g, "")), // 20일 월급
        totalSalary,
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
          
          {/* 로그인한 사용자 표시 */}
          {userId && (
            <div className="text-white text-center mb-4">
              <p className="text-lg font-semibold">{userId}님이 로그인했습니다.</p>
            </div>
          )}

          <h2 className="text-2xl font-bold text-center mb-4 text-white">가계부 계산기</h2>

          {/* 5일 수당 & 20일 월급 입력 */}
          <label className="text-white text-sm">5일 수당</label>
          <input
            type="text"
            placeholder="5일 수당을 입력하세요"
            className="w-full p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
            value={allowance}
            onChange={handleAllowanceChange}
          />

          <label className="text-white text-sm">20일 월급</label>
          <input
            type="text"
            placeholder="20일 월급을 입력하세요"
            className="w-full p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
            value={salary}
            onChange={handleSalaryChange}
          />

          {/* 합산된 금액 한글 변환 */}
          {totalSalary > 0 && (
            <p className="text-gray-400 text-sm mb-3">
              한글 금액: {numberToKorean(totalSalary)}
            </p>
          )}

          <button
            onClick={handleCalculate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-300 mb-3"
          >
            계산하기
          </button>

          {/* 계산 결과 출력 */}
          {allocated.생활비 > 0 && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <p>생활비: <strong>{allocated.생활비.toLocaleString()}원</strong> ({accountNumbers.생활비})</p>
              <p>적금: <strong>{allocated.적금.toLocaleString()}원</strong> ({accountNumbers.적금})</p>
              <p>투자: <strong>{allocated.투자.toLocaleString()}원</strong> ({accountNumbers.투자})</p>
              <p>가족: <strong>{allocated.가족.toLocaleString()}원</strong> ({accountNumbers.가족})</p>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded transition duration-300 mt-3"
          >
            저장하기
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
