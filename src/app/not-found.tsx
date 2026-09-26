import Link from "next/link";
import { Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Heart className="text-blue-600" size={24} fill="currentColor" />
        <span className="text-xl font-bold text-gray-900">Not Alone</span>
      </Link>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-8">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm"
      >
        Go home
      </Link>
    </div>
  );
}
