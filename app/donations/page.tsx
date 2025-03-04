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
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  // 🔹 CSV 파일 업로드 및 Firebase 저장 (배치 저장 + 업로드 속도 조절)
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

          const jsonData: any[] = rows.map((row) => ({
            date: row[0]?.trim() || "날짜 없음",
            name: row[1]?.trim() || "이름 없음",
            reason: row[2]?.trim() || "사유 없음",
            amount: Number(row[3]?.trim()) || 0, // ✅ 빈 값일 경우 0으로 처리
          }));

          if (jsonData.length === 0) {
            alert("📢 CSV 파일이 비어 있습니다! ❌\n\n📌 해결 방법:\n✅ 한셀에서 직접 열어 데이터가 있는지 확인\n✅ '다른 이름으로 저장' 후 CSV 형식으로 다시 저장 후 업로드");
            return;
          }

          console.log(`📢 총 ${jsonData.length}개의 데이터를 업로드합니다.`);

          // ✅ Firestore 배치 저장 및 딜레이 적용 (속도 제한 방지)
          for (let i = 0; i < jsonData.length; i++) {
            await addDoc(collection(db, "donations"), jsonData[i]);

            // 🔹 50ms 대기 → Firebase 쓰기 제한 방지 (1초에 20개 정도만 저장)
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
        className={`p-2 rounded ${selectedFile ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"}`}
        disabled={!selectedFile}
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
    </div>
  );
}
