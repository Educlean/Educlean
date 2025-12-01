import type { NextPage } from 'next';
import type { AppProps } from 'next/app';

export type NextPageWithLayout<P = Record<string, never>, IP = P> = NextPage<P, IP> & {
  noLayout?: boolean;
};

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
