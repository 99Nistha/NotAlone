export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 h-14" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-10" />
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
