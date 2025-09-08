type ButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
};

export default function GButton({ label, onClick, className }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${className} rounded-lg p-3 border mt-2 items-center flex flex-col`}
    >
      {label}
    </button>
  );
}
