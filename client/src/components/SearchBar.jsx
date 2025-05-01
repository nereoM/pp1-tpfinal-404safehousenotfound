import { useState } from "react";

export function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex items-center gap-2">
      <input
        type="text"
        placeholder="Buscar empleos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Buscar
      </button>
    </form>
  );
}