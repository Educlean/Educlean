import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "./layout";
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  // Registro del service worker para PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => console.log("✅ SW registrado:", reg.scope))
        .catch((err) => console.error("❌ Error SW:", err));
    }
  }, []);

  console.log("Component name:", Component.name);

  // Páginas especiales que no usan Layout
  if (Component.name === "Page") {
    return <Component {...pageProps} />;
  }

  // Layout general
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
