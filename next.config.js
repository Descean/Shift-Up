/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

module.exports = nextConfig;
