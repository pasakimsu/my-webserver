"use client";

interface BudgetSaveButtonProps {
  onSave: () => void;
}

export default function BudgetSaveButton({ onSave }: BudgetSaveButtonProps) {
  return (
    <button
      onClick={onSave}
      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded transition duration-300 mt-3"
    >
      저장하기
    </button>
  );
}
