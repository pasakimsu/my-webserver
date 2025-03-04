"use client";

import { useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";

export default function DonationsPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // 🔹 파일 선택 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // 🔹 한셀 .cell 파일이면 업로드 불가능 경고
      if (file.name.endsWith(".cell")) {
        alert(
          "⚠️ 한셀(.cell) 파일은 직접 업로드할 수 없습니다. \n\n📌 해결 방법:\n✅ 한셀에서 '다른 이름으로 저장' → 'CSV (.csv)'로 변환 후 업로드하세요!"
        );
        return;
      }

      // 🔹 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.");
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
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
      reader.readAsText(selectedFile, "utf-8"); // CSV 파일 읽기
      reader.onload = async (e) => {
        try {
          const csvData = e.target?.result as string;
          const rows = csvData.split("\n").map((row) => row.split(",")); // 쉼표로 데이터 분리

          // 🔹 첫 번째 줄(헤더) 제거
          rows.shift();

          const jsonData: any[] = rows.map((row) => ({
            date: row[0]?.trim() || "",
            name: row[1]?.trim() || "",
            reason: row[2]?.trim() || "",
            amount: Number(row[3]?.trim()) || 0,
          }));

          if (jsonData.length === 0) {
            alert("📢 CSV 파일이 비어 있습니다! ❌\n\n📌 해결 방법:\n✅ 한셀에서 직접 열어 데이터가 있는지 확인\n✅ '다른 이름으로 저장' 후 CSV 형식으로 다시 저장 후 업로드");
            return;
          }

          for (const row of jsonData) {
            await addDoc(collection(db, "donations"), row);
          }

          alert("✅ 업로드 완료!");
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
        className={`p-2 rounded ${selectedFile ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"}`}
        disabled={!selectedFile}
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
    </div>
  );
}
