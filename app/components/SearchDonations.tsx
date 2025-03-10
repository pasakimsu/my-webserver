"use client";

import { useState } from "react";
import { db, collection, getDocs, query, where } from "@/lib/firebase";

export default function SearchDonations() {
  const [searchName, setSearchName] = useState(""); // 🔍 검색할 이름
  const [searchResults, setSearchResults] = useState<any[]>([]); // 🔍 검색 결과
  const [loading, setLoading] = useState(false); // 검색 로딩 상태

  // 🔹 Firestore에서 해당 이름이 포함된 부조금 내역 검색
  const handleSearch = async () => {
    if (!searchName.trim()) {
      alert("검색할 이름을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "donations"),
        where("nameKeywords", "array-contains", searchName.trim()) // 🔍 부분 검색 적용
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchResults([]);
        alert("❌ 해당 이름으로 등록된 부조금 내역이 없습니다.");
      } else {
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error("❌ 검색 오류:", error);
      alert("❌ 검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <h2 className="text-2xl font-bold mb-4">부조금 검색</h2>

      <input
        type="text"
        placeholder="이름을 입력하세요"
        className="p-3 mb-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
      />

      <button
        onClick={handleSearch}
        className={`p-3 rounded-lg w-40 mb-4 ${
          searchName ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"
        }`}
        disabled={!searchName}
      >
        {loading ? "검색 중..." : "🔍 검색"}
      </button>

      {/* 🔹 검색 결과 출력 */}
      {searchResults.length > 0 && (
        <div className="w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">검색 결과</h3>
          <ul>
            {searchResults.map((result) => (
              <li key={result.id} className="border-b border-gray-600 py-2">
                📅 <strong>{result.date}</strong> | 👤 <strong>{result.name}</strong> | 💰 <strong>{result.amount.toLocaleString()}원</strong> | 📝 <strong>{result.reason}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
