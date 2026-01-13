"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/router";
import { User } from "../../lib/types";

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// 👇 URLs públicas reales
const PUBLIC_ROUTES = ["/public/schoolRequest"];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  // 👇 esto SÍ existe ahora
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data: User = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Al montar
  useEffect(() => {
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    fetchMe();
  }, [isPublicRoute]);

  // 🔹 Evento login solo en rutas privadas
  useEffect(() => {
    if (isPublicRoute) return;

    const onLogin = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail) return;

        const minimalUser: User = {
          role: detail.role || "",
          accountId: detail.accountId || "",
          name: "",
          email: "",
          mobile: "",
          DOB: null,
          allergies: [],
          RH: undefined,
          employeeID: "",
        };

        setUser(minimalUser);
        fetchMe();
      } catch {
        // silencio absoluto
      }
    };

    window.addEventListener("edu:login", onLogin as EventListener);
    return () =>
      window.removeEventListener("edu:login", onLogin as EventListener);
  }, [isPublicRoute]);

  // ✅ RUTA PÚBLICA: sin auth, sin loading, sin redirects
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return ctx;
};
