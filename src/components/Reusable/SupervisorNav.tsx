import home from "../../assets/icons/Home.svg";
import uploadFile from "../../assets/icons/UploadFile.svg";
import createUser from "../../assets/icons/CreateUser.svg";
import calculator from "../../assets/icons/calculator.svg";
import book from "@/assets/icons/book.svg";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { Clock } from "lucide-react";

function SupervisorNavBar() {
  const router = useRouter();

  const navItems = useMemo(
    () => [
      { href: "/supervisor/Dashboard", label: "Home", icon: home },
      {
        href: "/supervisor/CreateAccount",
        label: "Create Account",
        icon: createUser,
      },
      { href: "/supervisor/UploadFile", label: "Schedule", icon: uploadFile },
      { href: "/supervisor/Calculator", label: "Calculator", icon: calculator },
      {
        href: "/supervisor/Hours",
        label: "Hours worked",
        lucideIcon: Clock,
      },
      { href: "/supervisor/School", label: "Schools", icon: book },
    ],
    []
  );

  const navItemsMobile = useMemo(
    () => [
      {
        href: "/supervisor/CreateAccount",
        label: "Create Account",
        icon: createUser,
      },
      { href: "/supervisor/UploadFile", label: "Schedule", icon: uploadFile },
      { href: "/supervisor/Dashboard", label: "Home", icon: home },
      { href: "/supervisor/Calculator", label: "Calculator", icon: calculator },
      {
        href: "/supervisor/Hours",
        label: "Hours worked",
        lucideIcon: Clock,
      },
      { href: "/supervisor/School", label: "Schools", icon: book },
    ],
    []
  );

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="lg:w-[300px]">
      <div className="flex justify-center lg:hidden">
        <div className="bg-[var(--secondary)] flex flex-row justify-around px-20 items-center h-15 w-full rounded-t-lg">
          {navItemsMobile.map(({ href, icon, lucideIcon, label }) => {
            const Icon = lucideIcon;
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex flex-row rounded-lg px-2 py-2 gap-3 ${
                    isActive(href) ? "bg-green-50" : ""
                  }`}
                >
                  {Icon ? (
                    <Icon className="w-5 h-5 text-black" />
                  ) : (
                    <Image src={icon} alt={`${label}-Icon`} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="lg:flex hidden w-full h-full">
        <div className="p-10 w-full flex flex-col gap-3">
          {navItems.map(({ href, label, icon, lucideIcon }) => {
            const Icon = lucideIcon;
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${
                    isActive(href) ? "bg-[var(--light-gray)]" : ""
                  }`}
                >
                  {Icon ? (
                    <Icon className="w-5 h-5 text-gray-800" />
                  ) : (
                    <Image src={icon} alt={`${label}-Icon`} />
                  )}
                  <p>{label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default React.memo(SupervisorNavBar);
