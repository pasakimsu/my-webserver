"use client";

interface TaxInputProps {
  inputs: { [key: string]: string };
  onChange: (key: string, value: string) => void;
}

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

export default function TaxInput({ inputs, onChange }: TaxInputProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        ["연봉", "income"],
        ["신용카드", "credit"],
        ["체크카드", "debit"],
        ["전통시장", "market"],
        ["대중교통", "transport"],
        ["문화생활", "culture"],
      ].map(([label, key]) => (
        <div key={key} className="mb-3">
          <label className="block text-sm text-gray-300">{label}</label>
          <input
            type="text"
            placeholder={label}
            value={inputs[key]}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 text-center"
          />
          <p className="text-gray-400 text-xs mt-1 text-center">
            {inputs[key] ? numberToKorean(parseInt(inputs[key].replace(/,/g, ""), 10)) : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
