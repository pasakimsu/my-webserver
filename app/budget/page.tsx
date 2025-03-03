"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, collection, query, where, getDocs, doc, setDoc } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import BudgetHeader from "../components/BudgetHeader";
import BudgetInput from "../components/BudgetInput";
import BudgetSummary from "../components/BudgetSummary";
import BudgetDateSelector from "../components/BudgetDateSelector";
import BudgetSaveButton from "../components/BudgetSaveButton";
import BudgetComparisonTable from "../components/BudgetComparisonTable";

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
  const [year] = useState<string>("2025"); // 2025년 고정
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
  const [loading, setLoading] = useState<boolean>(false);

  // 로그인 여부 확인
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  // Firebase에서 특정 월 데이터 가져오기
  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "budgets"), where("year", "==", "2025"), where("month", "==", month));
        const querySnapshot = await getDocs(q);

        const budgets = querySnapshot.docs.map((doc) => ({
          userId: doc.data().userId,
          생활비: doc.data().allocations.생활비 || 0,
          적금: doc.data().allocations.적금 || 0,
          투자: doc.data().allocations.투자 || 0,
          가족: doc.data().allocations.가족 || 0,
        }));

        setUserBudgets(budgets);
      } catch (error) {
        console.error("데이터 불러오기 실패:", error);
      }
      setLoading(false);
    };

    fetchBudgets();
  }, [month]);

  // 5일 수당 입력값 변경
  const handleAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    const numValue = Number(rawValue);
    if (!isNaN(numValue)) {
      setAllowance(numValue.toLocaleString());
      updateTotalSalary(numValue, salary);
    }
  };

  // 20일 월급 입력값 변경
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    const numValue = Number(rawValue);
    if (!isNaN(numValue)) {
      setSalary(numValue.toLocaleString());
      updateTotalSalary(allowance, numValue);
    }
  };

  // 총 급여 업데이트 (5일 수당 + 20일 월급)
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
      <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6">
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <BudgetHeader userId={userId} />
          <BudgetDateSelector year="2025" month={month} onMonthChange={(e) => setMonth(e.target.value)} />
          <BudgetInput
            allowance={allowance}
            salary={salary}
            onAllowanceChange={handleAllowanceChange}
            onSalaryChange={handleSalaryChange}
          />
          {totalSalary > 0 && <p className="text-gray-400 text-sm mb-3">한글 금액: {numberToKorean(totalSalary)}</p>}
          <button onClick={handleCalculate} className="w-full bg-blue-500 text-white font-bold py-3 rounded">계산하기</button>
          <BudgetSummary allocated={allocated} accountNumbers={{ 생활비: "", 적금: "", 투자: "", 가족: "" }} />
          <BudgetSaveButton onSave={handleSave} />
          {loading ? <p className="text-white mt-6">데이터 불러오는 중...</p> : <BudgetComparisonTable userBudgets={userBudgets} />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
