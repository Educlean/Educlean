import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public", // Generates service worker in public/sw.js
  disable: process.env.NODE_ENV === "development", // Disable in dev
  register: true,
  skipWaiting: true,
  // Optional: customize cache strategies
  runtimeCaching: [], // You can customize this
  buildExcludes: [/middleware-manifest\.json$/, /dynamic-css-manifest\.json$/],
});

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
};

export default withPWA(nextConfig);
