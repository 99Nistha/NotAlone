import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Not Alone — Connect with Families Like Yours",
  description:
    "A free community connecting parents of disabled and chronically ill children with families facing the same condition. You are not alone.",
  keywords: ["disability", "chronic illness", "parent support", "community", "children"],
  openGraph: {
    title: "Not Alone",
    description: "Connect with families who truly understand your journey.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
