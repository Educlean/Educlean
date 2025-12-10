import logoHeader from "../../assets/Images/logo.png";
import bell from "../../assets/icons/bell.png";
import Image from "next/image";
import { useRouter } from "next/router";
import { useUser } from "../../context/UserContext";

export default function Header() {
  const router = useRouter();
  const { setUser } = useUser();

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
    try {
      router.replace("/login");
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="bg-[var(--accent)] px-6 py-10 flex flex-row justify-between items-center lg:py-4 px-10">
      <Image
        src={logoHeader}
        alt="Logo-Educlean"
        className="h-7 w-40 md:h-10 lg:h-8"
      />
      <div className="flex items-center gap-4">
        <Image src={bell} alt="bell-icon" className="h-5 w-5" />
        <button onClick={onLogout} className="text-white text-sm">Log out</button>
      </div>
    </div>
  );
}
