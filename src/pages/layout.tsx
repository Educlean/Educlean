"use client";

import Header from "../components/Reusable/Header";
import SnavBar from "../components/Reusable/SupervisorNav";
import CleanerNav from "../components/Reusable/CleanerNav";
import { ReactNode, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/router";


type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  // Debug logging removed to avoid noisy output in production
  // Function to render the appropriate navigation based on user role
  const renderNavigation = () => {
    if (!user) return null;

    switch (user.role?.toLowerCase()) {
      case 'supervisor':
        return <SnavBar />;
      case 'cleaner':
        return <CleanerNav />;
      default:
        return null;
    }
  };

  // redirect unauthenticated users to login after initial load
  useEffect(() => {
    if (!loading && !user) {
      // Use absolute path to avoid resolving relative to the current route
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return (
    <div className="bg-white min-h-screen flex items-center justify-center rounded-lg p-6 mb-6">
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[#39B52D] rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">Loading data...</p>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div>
      <Header />
      <div className="lg:flex lg:flex-row-reverse">
        <main className="lg:bg-[var(--light-gray)] flex-1">{children}</main>
        {user && renderNavigation()}
      </div>
    </div>
  );
}
