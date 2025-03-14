"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, doc, setDoc, getDocs, collection } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import BudgetHeader from "../components/BudgetHeader";
import BudgetInput from "../components/BudgetInput";
import BudgetSummary from "../components/BudgetSummary";
import BudgetDateSelector from "../components/BudgetDateSelector";
import BudgetSaveButton from "../components/BudgetSaveButton";

const accountNumbers = {
  생활비: "1000-8998-1075(토스)",
  적금: "1001-0319-4099(토스)",
  투자: "321-8556-5901(kb증권)",
  가족: "1000-8345-4263(토스)",
};

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
  const [year, setYear] = useState<string>("2025");
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, "0"));
  const [allowance, setAllowance] = useState<string>("");
  const [salary, setSalary] = useState<string>("");
  const [totalSalary, setTotalSalary] = useState<number>(0);
  const [allocated, setAllocated] = useState<{ [key: string]: number }>({
    생활비: 0,
    적금: 0,
    투자: 0,
    가족: 0,
  });
  const [userBudgets, setUserBudgets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
      setIsAdmin(storedUserId === "bak" || storedUserId === "yong"); // ✅ bak 또는 yong만 부조금 관리 가능
      fetchUserBudgets(year, month);
    }
  }, [router, year, month]);

  const handleAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value.replace(/,/g, ""), 10) || 0;
    setAllowance(numValue.toLocaleString());
    updateTotalSalary(numValue, salary);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value.replace(/,/g, ""), 10) || 0;
    setSalary(numValue.toLocaleString());
    updateTotalSalary(allowance, numValue);
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
        allowance: Number(allowance.replace(/,/g, "")),
        salary: Number(salary.replace(/,/g, "")),
        totalSalary,
        allocations: allocated,
        timestamp: new Date(),
      });

      alert("✅ 저장되었습니다!");
      fetchUserBudgets(year, month);
    } catch (error) {
      console.error("❌ 저장 실패:", error);
      alert("❌ 저장 중 오류가 발생했습니다.");
    }
  };

  const fetchUserBudgets = async (year: string, month: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, "budgets"));
      const budgets = querySnapshot.docs
        .map((doc) => ({
          userId: doc.data().userId,
          year: doc.data().year,
          month: doc.data().month,
          생활비: doc.data().allocations?.생활비 || 0,
          적금: doc.data().allocations?.적금 || 0,
          투자: doc.data().allocations?.투자 || 0,
          가족: doc.data().allocations?.가족 || 0,
        }))
        .filter((data) => data.year === year && data.month === month);

      setUserBudgets(budgets);
    } catch (error) {
      console.error("❌ 데이터 불러오기 오류:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900">
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <BudgetHeader userId={userId} />
          <BudgetDateSelector year="2025" month={month} onMonthChange={(e) => setMonth(e.target.value)} />
          <BudgetInput allowance={allowance} salary={salary} onAllowanceChange={handleAllowanceChange} onSalaryChange={handleSalaryChange} />
          {totalSalary > 0 && <p className="text-gray-400 text-sm mb-3">한글 금액: {numberToKorean(totalSalary)}</p>}
          <button onClick={handleCalculate} className="w-full bg-blue-500 text-white font-bold py-3 rounded">계산하기</button>
          <BudgetSummary allocated={allocated} accountNumbers={accountNumbers} />
          <BudgetSaveButton onSave={handleSave} />

          {/* 🔹 소득공제 계산 버튼 추가 */}
          <button
            onClick={() => router.push("/tax")}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded mt-4"
          >
            소득공제 계산하기
          </button>

          {isAdmin && (
            <button onClick={() => router.push("/donations")} className="w-full bg-purple-500 text-white font-bold py-3 rounded mt-4">
              부조금 관리
            </button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
