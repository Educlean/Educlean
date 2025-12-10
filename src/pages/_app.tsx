// pages/_app.tsx
import "../styles/globals.css";

import React from "react";
import type { AppProps } from "next/app";
import Layout from "./layout";
import { UserProvider } from "../context/UserContext";

// Support pages setting `noLayout = true` or providing a `getLayout` function.
type ComponentWithLayout = AppProps["Component"] & {
  noLayout?: boolean;
  getLayout?: (page: React.ReactNode) => React.ReactNode;
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const Comp = Component as ComponentWithLayout;

  // If the page provides a getLayout function, use it (recommended pattern).
  if (typeof Comp.getLayout === "function") {
    return (
      <UserProvider>
        {Comp.getLayout(<Component {...pageProps} />)}
      </UserProvider>
    );
  }

  // If the page opts out of the layout via a static property `noLayout`, render plainly.
  if (Comp.noLayout) {
    return (
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    );
  }

  // Default: wrap with Layout.
  return (
    <UserProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProvider>
  );
}
