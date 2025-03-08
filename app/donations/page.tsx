"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, collection, getDocs } from "@/lib/firebase";
import DonationsHeader from "../components/DonationsHeader";
import FileUpload from "../components/FileUpload";
import DeleteAllButton from "../components/DeleteAllButton";
import SearchDonations from "../components/SearchDonations"; // 🔍 검색 기능 추가!

export default function DonationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    // 🔹 로그인한 사용자 확인
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);

      // 🔹 bak이 아닌 경우 접근 차단
      if (storedUserId !== "bak") {
        alert("🚨 접근 권한이 없습니다.");
        router.push("/budget");
      } else {
        fetchDonations();
      }
    }
  }, [router]);

  // 🔹 Firestore에서 부조금 데이터 가져오기
  const fetchDonations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "donations"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDonations(data);
    } catch (error) {
      console.error("❌ 데이터 불러오기 오류:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6 text-white">
      <DonationsHeader />
      <FileUpload />
      <DeleteAllButton />
      <SearchDonations /> {/* 🔍 부분 검색 UI 추가 */}

      {/* 🔹 부조금 리스트 출력 */}
      {donations.length > 0 && (
        <div className="w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
          <h3 className="text-lg font-semibold mb-2">📋 부조금 내역</h3>
          <ul>
            {donations.map((donation) => (
              <li key={donation.id} className="border-b border-gray-600 py-2">
                📅 <strong>{donation.date}</strong> | 👤 <strong>{donation.name}</strong> | 💰{" "}
                <strong>{donation.amount.toLocaleString()}원</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
