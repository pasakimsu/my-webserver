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

// ✅ 입력값을 담을 객체 타입 지정
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

  const handleChange = (key: keyof Inputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: formatNumber(value) }));
  };

  // ✅ 계산 실행 함수
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
      💰 총 소득공제 금액: ${deductionAmount.toLocaleString()}원 (${numberToKorean(deductionAmount)})`
    );
  };

  return (
    <div className="flex items-start min-h-screen justify-center bg-gray-900 text-white p-6">
      {/* 왼쪽: 입력 필드 */}
      <div className="w-1/2 p-4">
        <h1 className="text-xl font-bold mb-4">소득공제 계산기</h1>

        <div className="grid grid-cols-2 gap-4">
          {[
            ["연봉", "income"],
            ["신용카드", "credit"],
            ["체크카드", "debit"],
            ["전통시장", "market"],
            ["대중교통", "transport"],
            ["문화생활", "culture"],
          ].map(([label, key], index) => (
            <div key={index} className="mb-3">
              <label className="block text-sm text-gray-300">{label}</label>
              <input
                type="text"
                placeholder={label}
                value={inputs[key as keyof Inputs]} // ✅ keyof 사용하여 타입 안전성 확보
                onChange={(e) => handleChange(key as keyof Inputs, e.target.value)}
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 text-center"
              />
              <p className="text-gray-400 text-xs mt-1 text-center">
                {inputs[key as keyof Inputs] ? numberToKorean(parseInt(inputs[key as keyof Inputs].replace(/,/g, ""), 10)) : ""}
              </p>
            </div>
          ))}
        </div>

        {/* 계산 버튼 */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded mt-3"
        >
          계산하기
        </button>
      </div>

      {/* 오른쪽: 결과 출력 */}
      <div className="w-1/2 p-4">
        <h2 className="text-lg font-semibold mb-3">계산 결과</h2>
        {result ? (
          <div className="p-4 bg-gray-800 rounded-lg whitespace-pre-line text-sm">
            {result}
          </div>
        ) : (
          <p className="text-gray-400">계산 결과가 여기에 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}
