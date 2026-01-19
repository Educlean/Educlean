type ButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onClick,
  className,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${className} bg-[var(--primary)] rounded-lg p-3 text-white mt-2
             transform transition-transform duration-200 ease-in-out
             hover:scale-101 cursor-pointer`}
    >
      {label}
    </button>
  );
}