"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, doc, setDoc } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import BudgetHeader from "../components/BudgetHeader";
import BudgetInput from "../components/BudgetInput";
import BudgetSummary from "../components/BudgetSummary";


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
  const [allowance, setAllowance] = useState<string>("");
  const [salary, setSalary] = useState<string>("");
  const [totalSalary, setTotalSalary] = useState<number>(0);
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

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

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

  const updateTotalSalary = (allowanceValue: string | number, salaryValue: string | number) => {
    const rawAllowance = Number(typeof allowanceValue === "string" ? allowanceValue.replace(/,/g, "") : allowanceValue);
    const rawSalary = Number(typeof salaryValue === "string" ? salaryValue.replace(/,/g, "") : salaryValue);
    setTotalSalary(rawAllowance + rawSalary);
  };

  const handleCalculate = () => {
    if (totalSalary <= 0) return;
    setAllocated({
      생활비: Math.floor(totalSalary * 0.25),
      적금: Math.floor(totalSalary * 0.25),
      투자: Math.floor(totalSalary * 0.15),
      가족: Math.floor(totalSalary * 0.1),
    });
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900">
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <BudgetHeader userId={userId} />
          <BudgetInput
            allowance={allowance}
            salary={salary}
            onAllowanceChange={handleAllowanceChange}
            onSalaryChange={handleSalaryChange}
          />
          {totalSalary > 0 && <p className="text-gray-400 text-sm mb-3">한글 금액: {numberToKorean(totalSalary)}</p>}
          <button onClick={handleCalculate} className="w-full bg-blue-500 text-white font-bold py-3 rounded">계산하기</button>
          <BudgetSummary allocated={allocated} accountNumbers={accountNumbers} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
