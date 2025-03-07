"use client";

import DonationsHeader from "../components/DonationsHeader";
import FileUpload from "../components/FileUpload";
import DeleteAllButton from "../components/DeleteAllButton";
import SearchDonations from "../components/SearchDonations"; // 🔍 검색 기능 추가!

export default function DonationsPage() {
  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6 text-white">
      <DonationsHeader />
      <FileUpload />
      <DeleteAllButton />
      <SearchDonations /> {/* 🔍 부분 검색 UI 추가 */}
    </div>
  );
}
