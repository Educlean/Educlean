"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User } from "../../lib/types";

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // reusable fetch that populates the full user from the server
  const fetchMe = async () => {
    setLoading(true);
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

  useEffect(() => {
    // On mount try to populate user from server (cookie is httpOnly)
    fetchMe();
  }, []);

  // Listen for an immediate client-side login event so the
  // context can be updated instantly (the server will still
  // validate the cookie on the next /api/auth/me call).
  useEffect(() => {
    const onLogin = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail) return;

        // set a minimal user so pages depending on role/accountId
        // can react immediately (redirects). Then request the
        // full user data from the server and replace the minimal
        // user with the real one.
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
        // fetch the complete user record from the server
        fetchMe();
      } catch {
        // noop
      }
    };

    window.addEventListener("edu:login", onLogin as EventListener);
    return () => window.removeEventListener("edu:login", onLogin as EventListener);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
};
