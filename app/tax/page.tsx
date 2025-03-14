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

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">소득공제 계산기</h1>

      {/* 금액 입력 필드 */}
      {[
        { label: "연봉 (원)", value: income, setter: setIncome },
        { label: "신용카드 사용금액 (원)", value: credit, setter: setCredit },
        { label: "체크카드 및 현금영수증 (원)", value: debit, setter: setDebit },
        { label: "전통시장 사용금액 (원)", value: market, setter: setMarket },
        { label: "대중교통 사용금액 (원)", value: transport, setter: setTransport },
        { label: "문화생활 사용금액 (원)", value: culture, setter: setCulture },
      ].map(({ label, value, setter }, idx) => (
        <div key={idx} className="w-2/3 mb-3">
          <label className="block text-sm text-gray-300">{label}</label>
          <input
            type="text"
            placeholder={label}
            value={value}
            onChange={(e) => setter(formatNumber(e.target.value))}
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
          />
          {/* 한글 금액 변환 표시 */}
          <p className="text-gray-400 text-sm mt-1">{value ? numberToKorean(parseInt(value.replace(/,/g, ""), 10)) : ""}</p>
        </div>
      ))}

      {/* 계산 버튼 */}
      <button
        onClick={handleCalculate}
        className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded mt-3"
      >
        계산하기
      </button>

      {/* 결과 출력 */}
      {result && (
        <div className="w-2/3 mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm">{result}</p>
        </div>
      )}
    </div>
  );
}
