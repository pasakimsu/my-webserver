"use client";

import { useState, useEffect } from "react";
import { db, collection, query, where, getDocs } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import BudgetDateSelector from "@/components/BudgetDateSelector";
import BudgetComparisonTable from "@/components/BudgetComparisonTable";

export default function BudgetComparePage() {
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, "0"));
  const [userBudgets, setUserBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-4">월별 사용자별 내는 돈 비교</h1>

        {/* 년월 선택 (2025년만) */}
        <BudgetDateSelector year="2025" month={month} onMonthChange={(e) => setMonth(e.target.value)} />

        {loading ? (
          <p className="text-white">데이터 불러오는 중...</p>
        ) : (
          <BudgetComparisonTable userBudgets={userBudgets} />
        )}
      </div>
    </ProtectedRoute>
  );
}
