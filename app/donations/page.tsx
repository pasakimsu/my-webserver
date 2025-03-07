"use client";

import { useState } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc } from "@/lib/firebase";

export default function DonationsPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

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
      reader.readAsText(selectedFile, "utf-8"); // ✅ UTF-8 인코딩 강제 적용
      reader.onload = async (e) => {
        try {
          let csvData = e.target?.result as string;

          // ✅ UTF-8 BOM 처리 (엑셀에서 저장한 CSV 인코딩 보정)
          if (csvData.charCodeAt(0) === 0xfeff) {
            csvData = csvData.slice(1);
          }

          const rows = csvData.split("\n").map((row) => row.split(",")); // 쉼표로 데이터 분리

          // 🔹 첫 번째 줄(헤더) 제거
          rows.shift();

          const jsonData: any[] = rows.map((row) => {
            const rawAmount = row[3]?.trim() || "0"; // ✅ 빈 값이면 "0"으로 설정
            const cleanedAmount = rawAmount.replace(/,/g, "").trim(); // ✅ 쉼표 제거 & 공백 제거

            return {
              date: row[0]?.trim() || "날짜 없음",
              name: row[1]?.trim() || "이름 없음",
              reason: row[2]?.trim() || "사유 없음",
              amount: isNaN(Number(cleanedAmount)) ? 0 : Number(cleanedAmount), // ✅ 숫자가 아니면 0으로 변환
            };
          });

          if (jsonData.length === 0) {
            alert("📢 CSV 파일이 비어 있습니다! ❌");
            return;
          }

          console.log(`📢 총 ${jsonData.length}개의 데이터를 업로드합니다.`);

          // ✅ Firestore 배치 저장 및 딜레이 적용 (속도 제한 방지)
          for (let i = 0; i < jsonData.length; i++) {
            await addDoc(collection(db, "donations"), jsonData[i]);

            // 🔹 50ms 대기 → Firebase 쓰기 제한 방지
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

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">부조금 관리</h2>

      {/* 🔹 파일 선택 버튼 */}
      <label className="bg-gray-700 text-white p-2 rounded cursor-pointer hover:bg-gray-600 mb-2">
        파일 선택
        <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </label>

      {/* 🔹 선택된 파일명 표시 */}
      {fileName && <p className="text-gray-400 mb-4">{fileName}</p>}

      {/* 🔹 업로드 버튼 */}
      <button
        onClick={handleFileUpload}
        className={`p-2 rounded mb-3 ${selectedFile ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"}`}
        disabled={!selectedFile}
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>

      {/* 🔹 일괄 삭제 버튼 */}
      <button
        onClick={handleDeleteAll}
        className={`p-2 rounded ${deleting ? "bg-red-700 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
        disabled={deleting}
      >
        {deleting ? "삭제 중..." : "⚠️ 전체 삭제"}
      </button>
    </div>
  );
}
