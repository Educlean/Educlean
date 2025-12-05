'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Login from './login';
import { useUser } from '../context/UserContext';

export default function Page() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const role = String(user.role || '').toLowerCase();
    if (role === 'supervisor') router.push('/supervisor/Dashboard');
    else router.push('/cleaner/DashboardCleaner');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return <Login />;
}