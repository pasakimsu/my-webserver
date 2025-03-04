"use client";

import { useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";
import * as ExcelJS from "exceljs";

export default function DonationsPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // 🔹 파일 선택 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // 🔹 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.");
        return;
      }

      setSelectedFile(file);
      setFileName(file.name); // 파일명 저장
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
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();

          // 🔹 Excel 메타데이터 오류 방지 (예외 처리 추가)
          try {
            await workbook.xlsx.load(arrayBuffer);
          } catch (metaError) {
            console.error("Excel 파일 메타데이터 로드 오류:", metaError);
            alert("엑셀 파일을 불러오는 중 오류가 발생했습니다. 다른 파일을 시도해주세요.");
            return;
          }

          // 🔹 첫 번째 시트 가져오기 (워크시트가 없는 경우 오류 방지)
          if (workbook.worksheets.length === 0) {
            alert("엑셀 파일에 시트가 없습니다. 올바른 파일인지 확인하세요.");
            return;
          }

          const worksheet = workbook.worksheets[0];
          const jsonData: any[] = [];

          // 🔹 `eachRow` 실행 전 worksheet가 정의되었는지 확인
          if (!worksheet) {
            alert("엑셀 파일에서 데이터를 찾을 수 없습니다.");
            return;
          }

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // 첫 번째 행(헤더) 스킵
            const rowData = {
              date: row.getCell(1).value?.toString() || "",
              name: row.getCell(2).value?.toString() || "",
              reason: row.getCell(3).value?.toString() || "",
              amount: Number(row.getCell(4).value) || 0,
            };
            jsonData.push(rowData);
          });

          // 🔹 Firebase에 데이터 저장
          for (const row of jsonData) {
            await addDoc(collection(db, "donations"), row);
          }

          alert("업로드 완료!");
          setSelectedFile(null); // 파일 선택 초기화
          setFileName(""); // 파일명 초기화
        } catch (error) {
          console.error("엑셀 파일 처리 오류:", error);
          alert("엑셀 파일을 처리하는 중 오류가 발생했습니다.");
        }
      };
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
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
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
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
