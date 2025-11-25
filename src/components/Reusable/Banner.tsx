type BannerProps = {
  label: string;
  className?: string;
  description?: string;
};

export default function Banner({ label, className, description }: BannerProps) {
  return (
    <div
      className={`rounded-bl-xl rounded-br-xl bg-[var(--secondary)] px-5 py-5 lg:bg-[var(--lightGray)] ${className}`}
    >
      <h1 className="font-bold text-4xl md:text-5xl">{label}</h1>
      <p className="text-lg md:text-2xl">{description}</p>
    </div>
  );
}
