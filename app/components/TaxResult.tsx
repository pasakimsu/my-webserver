"use client";

interface TaxResultProps {
  result: string | null;
}

export default function TaxResult({ result }: TaxResultProps) {
  return (
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
  );
}
