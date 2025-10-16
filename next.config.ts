import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
allowedDevOrigins: [
  'http://10.100.2.107:55640', // PC principal
  'http://172.20.10.2:55640',  // celular
]


};

export default nextConfig;
