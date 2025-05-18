import React from "react";

export default function CompanyHeader({ name, logoUrl }) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <img
        src={logoUrl}
        alt={name}
        className="h-12 w-12 object-contain rounded"
      />
      <h2 className="text-2xl font-semibold text-gray-800">{name}</h2>
    </div>
  );
}
