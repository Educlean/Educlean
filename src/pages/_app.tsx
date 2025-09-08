// pages/_app.tsx
import '../styles/globals.css';

import type { AppProps } from 'next/app';
import Layout from './layout';

export default function MyApp({ Component, pageProps }: AppProps) {
  console.log('Component name:', Component.name);
  if (Component.name === "Page") {
    return <Component {...pageProps} />;
  }
  
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
