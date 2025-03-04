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

          // 🔹 Excel 파일 로드 (메타데이터 오류 방지)
          try {
            await workbook.xlsx.load(arrayBuffer);
          } catch (metaError) {
            console.warn("📢 Excel 파일 메타데이터 오류 발생: 무시하고 계속 진행");
          }

          // 🔹 시트 목록 확인 및 로그 출력
          const sheetNames = workbook.worksheets.map((ws) => ws.name);
          console.log("📢 시트 목록:", sheetNames);

          // 🔹 시트가 없을 경우 오류 메시지 표시
          if (sheetNames.length === 0) {
            alert(
              "🚨 엑셀 파일에 시트가 없습니다! ❌\n\n📌 해결 방법:\n✅ Excel에서 직접 열어서 데이터가 있는지 확인\n✅ '다른 이름으로 저장' 후 .xlsx 형식으로 다시 저장 후 업로드"
            );
            return;
          }

          // 🔹 첫 번째 시트 가져오기
          const worksheet = workbook.getWorksheet(sheetNames[0]); // 첫 번째 시트 가져오기
          if (!worksheet) {
            alert("🚨 엑셀 파일에서 데이터를 찾을 수 없습니다. 올바른 파일인지 확인하세요.");
            return;
          }

          const jsonData: any[] = [];

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

          // 🔹 데이터가 비어 있는 경우 예외 처리
          if (jsonData.length === 0) {
            alert("📢 엑셀 파일이 비어 있습니다! ❌\n\n📌 해결 방법:\n✅ Excel에서 직접 열어 데이터가 있는지 확인\n✅ '다른 이름으로 저장' 후 .xlsx 형식으로 다시 저장 후 업로드");
            return;
          }

          // 🔹 Firebase에 데이터 저장
          for (const row of jsonData) {
            await addDoc(collection(db, "donations"), row);
          }

          alert("✅ 업로드 완료!");
          setSelectedFile(null); // 파일 선택 초기화
          setFileName(""); // 파일명 초기화
        } catch (error) {
          console.error("❌ 엑셀 파일 처리 오류:", error);
          alert("❌ 엑셀 파일을 처리하는 중 오류가 발생했습니다.");
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
