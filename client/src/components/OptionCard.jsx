import React from "react";

export function OptionCard({ icon: Icon, text, color, onClick }) {
  const bgColor = {
    teal: "bg-teal-100 hover:bg-teal-200 text-teal-600",
    blue: "bg-blue-100 hover:bg-blue-200 text-blue-600",
    yellow: "bg-yellow-100 hover:bg-yellow-200 text-yellow-600",
    purple: "bg-purple-100 hover:bg-purple-200 text-purple-600",
    indigo: "bg-indigo-100 hover:bg-indigo-200 text-indigo-600",
    red: "bg-red-100 hover:bg-red-200 text-red-600",
  }[color] || "bg-gray-100";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 ${bgColor} rounded-lg shadow-md cursor-pointer transition w-full`}
    >
      <Icon className={`w-6 h-6`} />
      <span className="text-gray-800 text-base sm:text-lg">{text}</span>
    </div>
  );
}