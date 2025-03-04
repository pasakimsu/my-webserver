"use client"; // ✅ 클라이언트 컴포넌트로 설정

import { useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";
import * as ExcelJS from "exceljs";

export default function DonationsPage() {
  const [uploading, setUploading] = useState(false);

  // 🔹 엑셀 파일 업로드 및 Firebase 저장
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
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
      {/* 🔹 엑셀 업로드 */}
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="mb-4 p-2 bg-gray-700 rounded" />
      {uploading && <p className="text-yellow-500">업로드 중...</p>}
    </div>
  );
}
