import Header from '../components/Reusable/Header';
import SnavBar from '../components/Reusable/SupervisorNav';
import { ReactNode, useState } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState('SP');

  return (
    <div>
      <Header />
      <div className="lg:flex lg:flex-row-reverse">
        <main className="lg:bg-[var(--light-gray)] flex-1">{children}</main>
        {user === 'SP' ? <SnavBar /> : null}
      </div>
    </div>
  );
}
