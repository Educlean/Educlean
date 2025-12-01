// pages/_app.tsx
import '../styles/globals.css';

import type { AppProps } from 'next/app';
import Layout from './layout';
import { UserProvider } from '../context/UserContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  console.log('Component name:', Component.name);
  if (Component.name === "Page") {
    return (
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    );
  }
  
  return (
    <UserProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProvider>
  );
}
