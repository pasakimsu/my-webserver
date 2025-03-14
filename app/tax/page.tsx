"use client";

import { useState } from "react";
import { db, doc, setDoc } from "@/lib/firebase";

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

export default function TaxCalculator() {
  const [income, setIncome] = useState("");
  const [credit, setCredit] = useState("");
  const [debit, setDebit] = useState("");
  const [market, setMarket] = useState("");
  const [transport, setTransport] = useState("");
  const [culture, setCulture] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const formatNumber = (value: string) => {
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleCalculate = () => {
    const incomeValue = parseInt(income.replace(/,/g, ""), 10) || 0;
    const creditValue = parseInt(credit.replace(/,/g, ""), 10) || 0;
    const debitValue = parseInt(debit.replace(/,/g, ""), 10) || 0;
    const marketValue = parseInt(market.replace(/,/g, ""), 10) || 0;
    const transportValue = parseInt(transport.replace(/,/g, ""), 10) || 0;
    const cultureValue = parseInt(culture.replace(/,/g, ""), 10) || 0;

    const minUsage = incomeValue * 0.25;
    const totalUsage = creditValue + debitValue + marketValue + transportValue + cultureValue;

    let deductionAmount = 0;
    let details = "";

    if (totalUsage > minUsage) {
      const excessUsage = totalUsage - minUsage;
      const creditDeduction = excessUsage * (creditValue / totalUsage) * 0.15;
      const debitDeduction = excessUsage * (debitValue / totalUsage) * 0.3;
      const basicDeductionBeforeLimit = creditDeduction + debitDeduction;

      const basicDeductionLimit = incomeValue <= 70000000 ? 3000000 : incomeValue <= 120000000 ? 2500000 : 2000000;
      const basicDeduction = Math.min(basicDeductionBeforeLimit, basicDeductionLimit);

      const marketDeduction = Math.min(marketValue * 0.4, 1000000);
      const transportDeduction = Math.min(transportValue * 0.4, 1000000);
      const cultureDeduction = incomeValue <= 70000000 ? Math.min(cultureValue * 0.3, 1000000) : 0;

      deductionAmount = basicDeduction + marketDeduction + transportDeduction + cultureDeduction;

      details = `
        기준 공제 금액: ${minUsage.toLocaleString()}원
        총 사용 금액: ${totalUsage.toLocaleString()}원
        초과 사용 금액: ${(excessUsage).toLocaleString()}원
        기본 공제 (한도 전): ${basicDeductionBeforeLimit.toLocaleString()}원
        기본 공제 한도 적용: ${basicDeduction.toLocaleString()}원
        전통시장 공제: ${marketDeduction.toLocaleString()}원
        대중교통 공제: ${transportDeduction.toLocaleString()}원
        문화생활 공제: ${cultureDeduction.toLocaleString()}원
        총 소득공제 금액: ${deductionAmount.toLocaleString()}원 (${numberToKorean(deductionAmount)})
      `;
    } else {
      details = "소득공제 가능 금액이 없습니다.";
    }

    setResult(details);
  };

  const handleSave = async () => {
    if (!result) {
      alert("계산 후 저장하세요.");
      return;
    }

    try {
      const docRef = doc(db, "tax_deductions", new Date().toISOString());
      await setDoc(docRef, {
        income,
        credit,
        debit,
        market,
        transport,
        culture,
        result,
        timestamp: new Date(),
      });
      alert("✅ 소득공제 계산 결과가 저장되었습니다!");
    } catch (error) {
      console.error("❌ 저장 오류:", error);
      alert("❌ 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">소득공제 계산기</h1>
      <input type="text" placeholder="연봉 (원)" value={income} onChange={(e) => setIncome(formatNumber(e.target.value))} className="p-3 w-full mb-3 bg-gray-700 border border-gray-600 rounded" />
      <input type="text" placeholder="신용카드 사용금액 (원)" value={credit} onChange={(e) => setCredit(formatNumber(e.target.value))} className="p-3 w-full mb-3 bg-gray-700 border border-gray-600 rounded" />
      <input type="text" placeholder="체크카드 및 현금영수증 (원)" value={debit} onChange={(e) => setDebit(formatNumber(e.target.value))} className="p-3 w-full mb-3 bg-gray-700 border border-gray-600 rounded" />
      <input type="text" placeholder="전통시장 사용금액 (원)" value={market} onChange={(e) => setMarket(formatNumber(e.target.value))} className="p-3 w-full mb-3 bg-gray-700 border border-gray-600 rounded" />
      <input type="text" placeholder="대중교통 사용금액 (원)" value={transport} onChange={(e) => setTransport(formatNumber(e.target.value))} className="p-3 w-full mb-3 bg-gray-700 border border-gray-600 rounded" />
      <input type="text" placeholder="문화생활 사용금액 (원)" value={culture} onChange={(e) => setCulture(formatNumber(e.target.value))} className="p-3 w-full mb-3 bg-gray-700 border border-gray-600 rounded" />
      
      <button onClick={handleCalculate} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded mt-3">계산하기</button>
      {result && <p className="mt-4 p-3 bg-gray-800 rounded-lg">{result}</p>}
      <button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded mt-3">저장하기</button>
    </div>
  );
}
