"use client";

import { useState } from "react";
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

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900">
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4 text-white">가계부 계산기</h2>
          <input
            type="text"
            placeholder="월급을 입력하세요"
            className="w-full p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
            value={salary}
            onChange={handleSalaryChange}
          />
          {/* 입력된 숫자를 한글 금액으로 변환하여 표시 */}
          {salary && (
            <p className="text-gray-400 text-sm mb-3">
              한글 금액: {numberToKorean(Number(salary.replace(/,/g, "")))}
            </p>
          )}
          <button
            onClick={handleCalculate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-300"
          >
            계산하기
          </button>
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p>생활비: <strong>{allocated.생활비.toLocaleString()}원</strong> ({accountNumbers.생활비})</p>
            <p>적금: <strong>{allocated.적금.toLocaleString()}원</strong> ({accountNumbers.적금})</p>
            <p>투자: <strong>{allocated.투자.toLocaleString()}원</strong> ({accountNumbers.투자})</p>
            <p>가족: <strong>{allocated.가족.toLocaleString()}원</strong> ({accountNumbers.가족})</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
