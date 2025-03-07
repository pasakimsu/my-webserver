"use client";

import { useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // 🔹 파일 선택 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  // 🔹 CSV 파일 업로드 및 Firestore 저장
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
            const name = row[1]?.trim() || "이름 없음";
            return {
              date: row[0]?.trim() || "날짜 없음",
              name: name,
              nameKeywords: generateNameKeywords(name), // 🔹 부분 검색을 위한 키워드 배열 추가
              reason: row[2]?.trim() || "사유 없음",
              amount: isNaN(Number(row[3]?.replace(/,/g, "").trim()))
                ? 0
                : Number(row[3]?.replace(/,/g, "").trim()),
            };
          });

          if (jsonData.length === 0) {
            alert("📢 CSV 파일이 비어 있습니다! ❌");
            return;
          }

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

  // 🔹 **부분 검색을 위해 이름 키워드 배열 생성 (모든 연속적인 부분 문자열 추가)**
  const generateNameKeywords = (name: string): string[] => {
    const keywords = new Set<string>();

    for (let i = 0; i < name.length; i++) {
      for (let j = i + 1; j <= name.length; j++) {
        keywords.add(name.substring(i, j)); // 모든 연속된 부분 문자열을 추가
      }
    }

    return Array.from(keywords);
  };

  return (
    <div className="flex flex-col items-center">
      <label className="bg-gray-700 text-white p-3 rounded-lg cursor-pointer hover:bg-gray-600 mb-3">
        📂 파일 선택
        <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </label>

      {fileName && <p className="text-gray-400 mb-4">📄 {fileName}</p>}

      <button
        onClick={handleFileUpload}
        className={`p-3 rounded-lg w-40 mb-4 ${
          selectedFile ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"
        }`}
        disabled={!selectedFile}
      >
        {uploading ? "업로드 중..." : "⬆️ 업로드"}
      </button>
    </div>
  );
}
