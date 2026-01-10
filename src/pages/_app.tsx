// pages/_app.tsx
import "../styles/globals.css";

import React from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "./layout";
import { UserProvider } from "../context/UserContext";

type ComponentWithLayout = AppProps["Component"] & {
  noLayout?: boolean;
  getLayout?: (page: React.ReactNode) => React.ReactNode;
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const Comp = Component as ComponentWithLayout;

  if (typeof Comp.getLayout === "function") {
    return (
      <UserProvider>
        {Comp.getLayout(
          <Component {...pageProps} key={router.asPath} />
        )}
      </UserProvider>
    );
  }

  if (Comp.noLayout) {
    return (
      <UserProvider>
        <Component {...pageProps} key={router.asPath} />
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <Layout>
        <Component {...pageProps} key={router.asPath} />
      </Layout>
    </UserProvider>
  );
}
