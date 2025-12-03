'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Login from './login';
import { useUser } from '../context/UserContext';

export default function Page() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const role = String(user.role || '').toLowerCase();
    if (role === 'supervisor') router.push('/supervisor/Dashboard');
    else router.push('/cleaner/DashboardCleaner');
  }, [user, router]);

  // while user is loading, show login or a spinner; if user exists we'll redirect
  return <Login />;
}
