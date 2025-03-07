"use client";

import DonationsHeader from "../components/DonationsHeader";
import FileUpload from "../components/FileUpload";
import DeleteAllButton from "../components/DeleteAllButton";

export default function DonationsPage() {
  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-900 p-6 text-white">
      <DonationsHeader />
      <FileUpload />
      <DeleteAllButton />
    </div>
  );
}
