"use client";

import { useState } from "react";

export default function BudgetPage() {
  const [salary, setSalary] = useState<number | "">("");
  const [allocated, setAllocated] = useState({
    생활비: 0,
    적금: 0,
    투자: 0,
    가족: 0,
  });

  const handleCalculate = () => {
    if (!salary || salary <= 0) return;

    setAllocated({
      생활비: Math.floor(salary * 0.25),
      적금: Math.floor(salary * 0.25),
      투자: Math.floor(salary * 0.15),
      가족: Math.floor(salary * 0.10),
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">가계부 계산기</h2>
        <input
          type="number"
          placeholder="월급을 입력하세요"
          className="w-full p-3 mb-3 border border-gray-400 rounded"
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
        />
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-300"
        >
          계산하기
        </button>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p>생활비 계좌: <strong>{allocated.생활비.toLocaleString()}원</strong></p>
          <p>적금 계좌: <strong>{allocated.적금.toLocaleString()}원</strong></p>
          <p>투자 계좌: <strong>{allocated.투자.toLocaleString()}원</strong></p>
          <p>가족 계좌: <strong>{allocated.가족.toLocaleString()}원</strong></p>
        </div>
      </div>
    </div>
  );
}
