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
