"use client";

import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import signIn from "../assets/Images/SignIn.png";
import PrimaryButton from "../components/Reusable/PrimaryButton";
import type { NextPageWithLayout } from "../../types/next-page";

const Login: NextPageWithLayout = () => {
  const router = useRouter();
  const date = new Date();
  const fullYear = date.getFullYear();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const employeeID = formData.get("user") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ employeeID, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error:", data.message);
        alert(data.message);
        return;
      }

      console.log("Login Successful:", data);

      // Marca que acaba de iniciar sesión
      try {
        sessionStorage.setItem("justLoggedIn", "1");
      } catch {}

      // 🔥 IMPORTANTE: ENVIAR DATOS MINIMOS AL CONTEXTO
      try {
        window.dispatchEvent(
          new CustomEvent("edu:login", {
            detail: {
              accountId: data.accountId,
              role: data.role,
            },
          })
        );
      } catch {}

      // Redirección según el rol
      const dest =
        data.role === "Supervisor"
          ? "/supervisor/Dashboard"
          : "/cleaner/DashboardCleaner";

      try {
        router.push(dest).catch(() => {
          window.location.href = dest;
        });
      } catch {
        window.location.href = dest;
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-between p-10 md:max-w-lg md:m-auto lg:max-w-xl lg:mx-auto">
        <h1 className="font-bold text-center text-3xl text-[var(--accent)]">
          WELCOME TO EDUCLEAN
        </h1>
        <Image src={signIn} alt="Welcome_Img" className="h-80" />

        <div>
          <form className="flex flex-col p-4 gap-5" onSubmit={onSubmit}>
            {/* User */}
            <div className="flex flex-col gap-2">
              <label htmlFor="user">User</label>
              <input
                id="user"
                type="text"
                name="user"
                className="border  border-gray-400 h-10 p-3 rounded-lg"
                placeholder="Your ID"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                className="border border-gray-400 h-10 p-3 rounded-lg"
                placeholder="Your password"
                required
              />
            </div>

            <PrimaryButton label="Submit" type="submit" />
          </form>
        </div>

        <p className="text-center font-thin">
          {`Educlean © ${fullYear} - All rights reserved`}
        </p>
      </div>
    </>
  );
};

Login.noLayout = true;
export default Login;
