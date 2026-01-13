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

const PUBLIC_ROUTES = ["/public/school-request"];

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    router.pathname.startsWith(route)
  );

  useEffect(() => {
    if (isPublicRoute) return;
    if (loading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [loading, user, router.pathname, isPublicRoute, router]);

  // 👉 RUTA PÚBLICA: sin auth, sin layout, sin drama
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 👉 RUTAS PRIVADAS: esperar user
  if (loading || !user) {
    return null;
  }

  const renderNavigation = () => {
    switch (user.role?.toLowerCase()) {
      case "supervisor":
        return <SnavBar />;
      case "cleaner":
        return <CleanerNav />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 flex-col lg:flex-row-reverse">
        <main className="flex-1 lg:bg-[var(--light-gray)] relative">
          {children}
        </main>

        <div
          id="nav-placeholder"
          className="lg:h-screen lg:overflow-y-auto"
        >
          {renderNavigation()}
        </div>
      </div>
    </div>
  );
}
