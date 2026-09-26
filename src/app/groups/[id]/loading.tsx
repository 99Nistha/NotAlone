export default function GroupLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 h-12" />
      <div className="bg-white border-b border-gray-100 h-10" />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex flex-col ${i % 2 === 0 ? "items-end" : "items-start"}`}
          >
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-1" />
            <div
              className={`h-10 rounded-2xl animate-pulse ${
                i % 2 === 0 ? "w-48 bg-blue-100" : "w-56 bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
