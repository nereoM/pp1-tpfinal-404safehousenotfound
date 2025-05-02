export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}