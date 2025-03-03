"use client";

interface UserBudget {
  userId: string;
  생활비: number;
  적금: number;
  투자: number;
  가족: number;
}

interface BudgetComparisonTableProps {
  userBudgets: UserBudget[];
}

export default function BudgetComparisonTable({ userBudgets }: BudgetComparisonTableProps) {
  // 항목별 합계 계산
  const total = userBudgets.reduce(
    (acc, user) => ({
      생활비: acc.생활비 + user.생활비,
      적금: acc.적금 + user.적금,
      투자: acc.투자 + user.투자,
      가족: acc.가족 + user.가족,
    }),
    { 생활비: 0, 적금: 0, 투자: 0, 가족: 0 }
  );

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white mt-6">
      <h2 className="text-lg font-bold mb-3 text-center">사용자별 내는 금액</h2>

      {/* 데이터가 없을 경우 안내 메시지 표시 */}
      {userBudgets.length === 0 ? (
        <p className="text-center text-gray-400">이 월에는 저장된 내역이 없습니다.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-600">
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
            {userBudgets.map((user) => (
              <tr key={user.userId} className="text-center">
                <td className="border border-gray-600 p-2">{user.userId}</td>
                <td className="border border-gray-600 p-2">{user.생활비.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2">{user.적금.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2">{user.투자.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2">{user.가족.toLocaleString()}원</td>
              </tr>
            ))}
            <tr className="bg-gray-700 font-bold text-center">
              <td className="border border-gray-600 p-2">합계</td>
              <td className="border border-gray-600 p-2">{total.생활비.toLocaleString()}원</td>
              <td className="border border-gray-600 p-2">{total.적금.toLocaleString()}원</td>
              <td className="border border-gray-600 p-2">{total.투자.toLocaleString()}원</td>
              <td className="border border-gray-600 p-2">{total.가족.toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
