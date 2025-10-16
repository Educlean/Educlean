import logoHeader from "../../assets/Images/logo.png";
import bell from "../../assets/Icons/bell.png";
import Image from "next/image";

export default function Header() {
  return (
    <div className="bg-[var(--accent)] px-6 py-10 flex flex-row justify-between items-center lg:py-4 px-10">
      <Image
        src={logoHeader}
        alt="Logo-Educlean"
        className="h-7 w-40 md:h-10 lg:h-8"
      />
      <Image src={bell} alt="bell-icon" className="h-5 w-5" />
    </div>
  );
}