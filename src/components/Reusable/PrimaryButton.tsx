type ButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onClick,
  className,
  disabled,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${className} bg-[var(--primary)] rounded-lg p-3 text-white mt-2`}
    >
      {label}
    </button>
  );
}
