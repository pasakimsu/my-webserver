"use client";

import { useState } from "react";
import { db, doc, setDoc } from "@/lib/firebase";

// 금액을 한글 단위로 변환하는 함수
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

// ✅ "inputs" 객체의 타입을 명확히 지정
interface Inputs {
  income: string;
  credit: string;
  debit: string;
  market: string;
  transport: string;
  culture: string;
}

export default function TaxCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
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

  // ✅ "key"가 정확한 Inputs 객체의 속성 중 하나라는 것을 명확히 지정
  const handleChange = (key: keyof Inputs, value: string) => {
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
      setResult("소득공제 가능 금액이 없습니다.");
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
      `총 공제액: ${deductionAmount.toLocaleString()}원 (${numberToKorean(
        deductionAmount
      )})`
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
      <h1 className="text-xl font-bold mb-4">소득공제 계산기</h1>

      {/* 입력 필드 */}
      {([
        ["연봉", "income"],
        ["신용카드", "credit"],
        ["체크카드", "debit"],
        ["전통시장", "market"],
        ["대중교통", "transport"],
        ["문화생활", "culture"],
      ] as const).map(([label, key], idx) => (
        <div key={idx} className="w-1/2 mb-2">
          <input
            type="text"
            placeholder={label}
            value={inputs[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 text-center"
          />
          <p className="text-gray-400 text-xs mt-1 text-center">
            {inputs[key] ? numberToKorean(parseInt(inputs[key].replace(/,/g, ""), 10)) : ""}
          </p>
        </div>
      ))}

      {/* 계산 버튼 */}
      <button
        onClick={handleCalculate}
        className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded mt-3"
      >
        계산하기
      </button>

      {/* 결과 출력 */}
      {result && (
        <div className="w-1/2 mt-3 p-2 bg-gray-800 rounded-lg text-center text-sm">
          {result}
        </div>
      )}
    </div>
  );
}
