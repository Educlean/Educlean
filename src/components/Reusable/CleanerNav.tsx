import home from "../../assets/icons/Home.svg";
import request from "../../assets/icons/request.svg";
import user from "../../assets/icons/user.svg";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

export default function SupervisorNavBar() {
  const router = useRouter();

  // Function to check if the current path matches the link path and apply the active class
  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="lg:w-[300px]">
      {/* Mobile */}
      <div className="flex justify-center mb-5 lg:hidden">
        <div className="bg-[var(--secondary)] flex flex-row justify-between items-center h-12 w-40 p-4 rounded-lg">
          <Link href="/cleaner/DashboardCleaner">
            <Image src={home} alt="Home-Icon" />
          </Link>
          <Link href="/cleaner/Profile">
            <Image src={user} alt="user-Icon" />
          </Link>
          <Link href="/cleaner/requests">
            <Image src={request} alt="request-Icon" />
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="lg:flex hidden w-full h-full">
        <div className="p-10 w-full flex flex-col gap-3">
          <Link href="/cleaner/DashboardCleaner">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${
                isActive("/cleaner/DashboardCleaner")
                  ? "bg-[var(--light-gray)]"
                  : ""
              }`}
            >
              <Image src={home} alt="Home-Icon" />
              <p>Home</p>
            </div>
          </Link>

          <Link href="/cleaner/Profile">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${
                isActive("/clenaer/Profile") ? "bg-[var(--light-gray)]" : ""
              }`}
            >
              <Image src={user} alt="user-Icon" />
              <p>Profile</p>
            </div>
          </Link>

          <Link href="/cleaner/requests">
            <div
              className={`flex flex-row rounded-lg px-5 py-2 gap-3 ${
                isActive("/cleaner/RequestsCleaner")
                  ? "bg-[var(--light-gray)]"
                  : ""
              }`}
            >
              <Image src={request} alt="request-Icon" />
              <p>Requests</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
