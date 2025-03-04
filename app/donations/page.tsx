"use client";

import { useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";
import * as ExcelJS from "exceljs";

export default function DonationsPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 🔹 파일 선택 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 🔹 엑셀 파일 업로드 및 Firebase 저장
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("업로드할 파일을 선택하세요.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(selectedFile);
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0]; // 첫 번째 시트 가져오기
        const jsonData: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // 첫 번째 행(헤더) 스킵
          const rowData = {
            날짜: row.getCell(1).value?.toString() || "",
            이름: row.getCell(2).value?.toString() || "",
            사유: row.getCell(3).value?.toString() || "",
            금액: Number(row.getCell(4).value) || 0,
          };
          jsonData.push(rowData);
        });

        // Firebase에 데이터 저장
        for (const row of jsonData) {
          await addDoc(collection(db, "donations"), {
            date: row.날짜,
            name: row.이름,
            reason: row.사유,
            amount: row.금액,
          });
        }

        alert("업로드 완료!");
        setSelectedFile(null); // 파일 선택 초기화
      };
    } catch (error) {
      console.error("엑셀 파일 처리 오류:", error);
      alert("엑셀 파일을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">부조금 관리</h2>

      {/* 🔹 파일 선택 */}
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mb-4 p-2 bg-gray-700 rounded" />
      
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
