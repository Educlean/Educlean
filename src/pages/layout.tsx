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

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }
  }, [loading, user, router]);

  // --------------------------------------------------
  // ❗ SOLUCIÓN: NADA DE NADA HASTA SABER USER
  // --------------------------------------------------
  if (loading || !user) {
    return null; // <- evita el mismatch TOTALMENTE
  }

  // --------------------------------------------------
  // UNA VEZ TENEMOS USER, YA ES SEGURO RENDERIZAR
  // --------------------------------------------------

  const renderNavigation = () => {
    if (!user) return null;

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
    <div>
      <Header />
      <div className="lg:flex lg:flex-row-reverse">
        <main className="lg:bg-[var(--light-gray)] flex-1 relative">
          {children}
        </main>

        <div id="nav-placeholder">{renderNavigation()}</div>
      </div>
    </div>
  );
}
