"use client";

import { useState } from "react";
import TaxInput from "./TaxInput";
import TaxResult from "./TaxResult";

export default function TaxCalculator() {
  const [inputs, setInputs] = useState({
    income: "",
    credit: "",
    debit: "",
    market: "",
    transport: "",
    culture: "",
  });
  const [result, setResult] = useState<string | null>(null);

  const formatNumber = (value: string) =>
    value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const handleChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: formatNumber(value) }));
  };

  const handleCalculate = () => {
    const num = (str: string) => parseInt(str.replace(/,/g, ""), 10) || 0;
    const { income, credit, debit, market, transport, culture } = inputs;

    const incomeValue = num(income);
    const minUsage = incomeValue * 0.25;
    const totalUsage =
      num(credit) + num(debit) + num(market) + num(transport) + num(culture);

    if (totalUsage <= minUsage) {
      setResult("❌ 소득공제 가능 금액이 없습니다.");
      return;
    }

    const excessUsage = totalUsage - minUsage;
    const creditDeduction = excessUsage * (num(credit) / totalUsage) * 0.15;
    const debitDeduction = excessUsage * (num(debit) / totalUsage) * 0.3;
    const basicDeductionBeforeLimit = creditDeduction + debitDeduction;

    const basicDeductionLimit =
      incomeValue <= 70000000
        ? 3000000
        : incomeValue <= 120000000
        ? 2500000
        : 2000000;
    const basicDeduction = Math.min(basicDeductionBeforeLimit, basicDeductionLimit);

    const marketDeduction = Math.min(num(market) * 0.4, 1000000);
    const transportDeduction = Math.min(num(transport) * 0.4, 1000000);
    const cultureDeduction = incomeValue <= 70000000 ? Math.min(num(culture) * 0.3, 1000000) : 0;

    const deductionAmount =
      basicDeduction + marketDeduction + transportDeduction + cultureDeduction;

    setResult(
      `✅ 기준 공제 금액: ${minUsage.toLocaleString()}원\n
      ✅ 총 사용 금액: ${totalUsage.toLocaleString()}원\n
      ✅ 초과 사용 금액: ${excessUsage.toLocaleString()}원\n
      ✅ 기본 공제 (한도 적용 후): ${basicDeduction.toLocaleString()}원\n
      🛒 전통시장 공제: ${marketDeduction.toLocaleString()}원\n
      🚇 대중교통 공제: ${transportDeduction.toLocaleString()}원\n
      🎭 문화생활 공제: ${cultureDeduction.toLocaleString()}원\n
      💰 총 소득공제 금액: ${deductionAmount.toLocaleString()}원`
    );
  };

  return (
    <div className="flex items-start min-h-screen justify-center bg-gray-900 text-white p-6">
      {/* 왼쪽: 입력 필드 */}
      <div className="w-1/2 p-4">
        <h1 className="text-xl font-bold mb-4">소득공제 계산기</h1>
        <TaxInput inputs={inputs} onChange={handleChange} />

        {/* 계산 버튼 */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded mt-3"
        >
          계산하기
        </button>
      </div>

      {/* 오른쪽: 결과 출력 */}
      <TaxResult result={result} />
    </div>
  );
}
