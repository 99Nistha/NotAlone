import Link from "next/link";
import { Heart, Users, MessageCircle, BookOpen, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf9ff]">
      {/* Navbar */}
      <nav className="border-b border-violet-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-500" size={24} fill="currentColor" />
            <span className="text-xl font-bold text-gray-900">Not Alone</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2 rounded-xl transition-colors"
            >
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Heart size={14} fill="currentColor" />
          Free forever for families
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6 text-balance">
          You are{" "}
          <span className="bg-gradient-to-r from-violet-600 to-rose-500 bg-clip-text text-transparent">
            not alone
          </span>{" "}
          on this journey
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 text-balance">
          Connect with parents raising children with the same diagnosis.
          Find real answers, shared experiences, and people who truly understand.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-violet-200"
          >
            Find your community
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-gray-700 text-lg font-semibold px-8 py-4 rounded-xl border border-violet-100 transition-colors"
          >
            Already a member? Log in
          </Link>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Parenting a child with a disability can feel isolating
              </h2>
              <ul className="space-y-3 text-gray-600">
                {[
                  "Mainstream groups don't understand your specific condition",
                  "Generic support groups mix dozens of different diagnoses",
                  "Finding families with the exact same diagnosis feels impossible",
                  "Children struggle to find peers who understand their experience",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Not Alone matches you by exact diagnosis
              </h2>
              <ul className="space-y-3 text-gray-600">
                {[
                  "AI-powered matching connects you to your specific condition group",
                  "Chat with parents who have walked the same path",
                  "Share what's worked — treatments, schools, therapists",
                  "Always free, moderated, and safe for families",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Everything your family needs in one place
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Heart className="text-rose-500" size={28} />,
              bg: "bg-rose-50",
              title: "Condition Matching",
              desc: "Describe your child's condition in plain English — our AI connects you to the right group instantly.",
            },
            {
              icon: <MessageCircle className="text-violet-600" size={28} />,
              bg: "bg-violet-50",
              title: "Group Chat",
              desc: "Real-time conversations with parents who share your exact diagnosis. Ask anything, any time.",
            },
            {
              icon: <BookOpen className="text-amber-500" size={28} />,
              bg: "bg-amber-50",
              title: "Resource Library",
              desc: "Crowd-sourced tips, treatments, schools, and specialists — built by families, for families.",
            },
            {
              icon: <Shield className="text-emerald-600" size={28} />,
              bg: "bg-emerald-50",
              title: "Safe & Moderated",
              desc: "Every group is moderated. Health data is encrypted. Your privacy is our priority.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-violet-100/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-gradient-to-r from-violet-600 to-rose-500 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="grid sm:grid-cols-3 gap-8 text-white">
            {[
              { stat: "100%", label: "Free for families" },
              { stat: "AI-powered", label: "Condition matching" },
              { stat: "Encrypted", label: "Health data storage" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-4xl font-extrabold mb-2">{item.stat}</div>
                <div className="text-white/80">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Ready to find your people?
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Join thousands of families navigating the same journey together.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-colors shadow-lg shadow-violet-200"
        >
          Get started — it&apos;s free
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-violet-100/60 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-500" size={16} fill="currentColor" />
            <span>Not Alone — Always free for families</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-900">Privacy</Link>
            <Link href="#" className="hover:text-gray-900">Safety</Link>
            <Link href="#" className="hover:text-gray-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
