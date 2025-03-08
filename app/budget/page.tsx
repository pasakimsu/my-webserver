"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, doc, setDoc, collection, getDocs } from "@/lib/firebase"; 
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

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
      fetchUserBudgets(year, month);
    }
  }, [router, year, month]);

  // 🔹 수당 및 월급 입력 핸들러
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

  // 🔹 총 월급 계산
  const updateTotalSalary = (allowanceValue: string | number, salaryValue: string | number) => {
    const rawAllowance = typeof allowanceValue === "string" ? parseInt(allowanceValue.replace(/,/g, ""), 10) || 0 : allowanceValue;
    const rawSalary = typeof salaryValue === "string" ? parseInt(salaryValue.replace(/,/g, ""), 10) || 0 : salaryValue;
    setTotalSalary(rawAllowance + rawSalary);
  };

  // 🔹 계산하기 버튼
  const handleCalculate = () => {
    if (totalSalary <= 0) return;
    setAllocated({
      생활비: Math.floor(totalSalary * 0.25),
      적금: Math.floor(totalSalary * 0.25),
      투자: Math.floor(totalSalary * 0.15),
      가족: Math.floor(totalSalary * 0.1),
    });
  };

  // 🔹 데이터 저장
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
        allowance: parseInt(allowance.replace(/,/g, ""), 10) || 0,
        salary: parseInt(salary.replace(/,/g, ""), 10) || 0,
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

  // 🔹 Firestore에서 사용자별 저장된 금액 가져오기
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
          <BudgetSummary allocated={allocated} accountNumbers={accountNumbers} />
          <BudgetSaveButton onSave={handleSave} />

          {/* ✅ 특정 사용자가 로그인한 경우 "부조금 관리" 버튼 표시 */}
          {userId === "bak" && (
            <button
              onClick={() => router.push("/donations")}
              className="w-full mt-4 bg-green-500 text-white font-bold py-3 rounded hover:bg-green-600"
            >
              부조금 관리
            </button>
          )}

          {/* 🔹 사용자별 입력된 금액을 표로 출력 */}
          {userBudgets.length > 0 && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg w-full">
              <h3 className="text-white text-lg font-semibold mb-3">사용자별 입력된 금액</h3>
              <table className="w-full text-white border-collapse border border-gray-600">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 p-2">사용자</th>
                    <th className="border border-gray-600 p-2">생활비</th>
                    <th className="border border-gray-600 p-2">적금</th>
                    <th className="border border-gray-600 p-2">투자</th>
                    <th className="border border-gray-600 p-2">가족</th>
                  </tr>
                </thead>
                <tbody>
                  {userBudgets.map((budget, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-gray-600 p-2">{budget.userId}</td>
                      <td className="border border-gray-600 p-2">{budget.생활비.toLocaleString()}원</td>
                      <td className="border border-gray-600 p-2">{budget.적금.toLocaleString()}원</td>
                      <td className="border border-gray-600 p-2">{budget.투자.toLocaleString()}원</td>
                      <td className="border border-gray-600 p-2">{budget.가족.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
