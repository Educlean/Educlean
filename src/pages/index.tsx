'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../context/UserContext';

export default function Page() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const role = String(user.role || '').toLowerCase();

    if (role === 'supervisor') {
      router.replace('/supervisor/Dashboard');
    } else {
      router.replace('/cleaner/DashboardCleaner');
    }
  }, [user, loading, router]);

  // ❗ IMPORTANT: NO RENDERIZAR LOGIN, NO LOADER, NADA
  // Esto asegura que SSR y CSR generen el mismo DOM (vacío)
  return null;
}
