"use client";

import { useState } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where } from "@/lib/firebase";

export default function DonationsPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [searchName, setSearchName] = useState(""); // 🔍 검색할 이름
  const [searchResults, setSearchResults] = useState<any[]>([]); // 🔍 검색 결과
  const [loading, setLoading] = useState(false); // 검색 로딩 상태

  // 🔹 파일 선택 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  // 🔹 Firebase에 저장된 모든 부조금 데이터 삭제
  const handleDeleteAll = async () => {
    const confirmDelete = confirm("🚨 모든 부조금 데이터를 삭제하시겠습니까?");
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const querySnapshot = await getDocs(collection(db, "donations"));

      if (querySnapshot.empty) {
        alert("📢 삭제할 데이터가 없습니다.");
        setDeleting(false);
        return;
      }

      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, "donations", document.id));
      }

      alert("✅ 모든 부조금 데이터가 삭제되었습니다!");
    } catch (error) {
      console.error("❌ 데이터 삭제 오류:", error);
      alert("❌ 데이터를 삭제하는 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 CSV 파일 업로드 및 Firebase 저장
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("업로드할 파일을 선택하세요.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsText(selectedFile, "utf-8");
      reader.onload = async (e) => {
        try {
          let csvData = e.target?.result as string;

          if (csvData.charCodeAt(0) === 0xfeff) {
            csvData = csvData.slice(1);
          }

          const rows = csvData.split("\n").map((row) => row.split(","));
          rows.shift(); // 첫 번째 줄(헤더) 제거

          const jsonData: any[] = rows.map((row) => {
            const rawAmount = row[3]?.trim() || "0";
            const cleanedAmount = rawAmount.replace(/,/g, "").trim();

            return {
              date: row[0]?.trim() || "날짜 없음",
              name: row[1]?.trim() || "이름 없음",
              reason: row[2]?.trim() || "사유 없음",
              amount: isNaN(Number(cleanedAmount)) ? 0 : Number(cleanedAmount),
            };
          });

          if (jsonData.length === 0) {
            alert("📢 CSV 파일이 비어 있습니다! ❌");
            return;
          }

          console.log(`📢 총 ${jsonData.length}개의 데이터를 업로드합니다.`);

          for (let i = 0; i < jsonData.length; i++) {
            await addDoc(collection(db, "donations"), jsonData[i]);

            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          alert(`✅ ${jsonData.length}개의 데이터가 성공적으로 업로드되었습니다!`);
          setSelectedFile(null);
          setFileName("");
        } catch (error) {
          console.error("❌ CSV 파일 처리 오류:", error);
          alert("❌ CSV 파일을 처리하는 중 오류가 발생했습니다.");
        }
      };
    } catch (error) {
      console.error("❌ 파일 업로드 오류:", error);
      alert("❌ 파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Firestore에서 해당 이름의 부조금 내역 검색
  const handleSearch = async () => {
    if (!searchName.trim()) {
      alert("검색할 이름을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "donations"), where("name", "==", searchName.trim()));
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
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">부조금 관리</h2>

      {/* 🔹 파일 선택 버튼 */}
      <label className="bg-gray-700 text-white p-3 rounded-lg cursor-pointer hover:bg-gray-600 mb-3">
        📂 파일 선택
        <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </label>

      {/* 🔹 선택된 파일명 표시 */}
      {fileName && <p className="text-gray-400 mb-4">📄 {fileName}</p>}

      {/* 🔹 업로드 버튼 */}
      <button
        onClick={handleFileUpload}
        className={`p-3 rounded-lg w-40 mb-4 ${
          selectedFile ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"
        }`}
        disabled={!selectedFile}
      >
        {uploading ? "업로드 중..." : "⬆️ 업로드"}
      </button>

      {/* 🔹 일괄 삭제 버튼 */}
      <button
        onClick={handleDeleteAll}
        className={`p-3 rounded-lg w-40 mb-6 ${
          deleting ? "bg-red-700 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
        }`}
        disabled={deleting}
      >
        {deleting ? "삭제 중..." : "🗑️ 전체 삭제"}
      </button>

      {/* 🔍 검색 기능 추가 */}
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
                📅 <strong>{result.date}</strong> | 👤 <strong>{result.name}</strong> | 💰 <strong>{result.amount.toLocaleString()}원</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
