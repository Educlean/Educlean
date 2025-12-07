import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔥 IMPORTANTE PARA QUE VERCEL IGNORE ESLINT
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;


export default nextConfig;
