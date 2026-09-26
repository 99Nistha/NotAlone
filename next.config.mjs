/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://snzjcagkdpnkzcqcqebe.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuempjYWdrZHBua3pjcWNxZWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTY4NjcsImV4cCI6MjEwNTkzMjg2N30.kPuQWFgJd0PRhNe29YpyZLYK0z6dnMtiogGysQgGFCE",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
