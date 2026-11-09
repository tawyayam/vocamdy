import Image from "next/image";

type ThemeLogoProps = {
  alt: string;
  size: number;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
};

export function ThemeLogo({
  alt,
  size,
  className,
  fetchPriority,
}: ThemeLogoProps) {
  const sharedClassName = className ? ` ${className}` : "";

  return (
    <>
      <Image
        src="/icons/logo-transparent-1024.png"
        alt={alt}
        width={size}
        height={size}
        fetchPriority={fetchPriority}
        className={`theme-logo-light${sharedClassName}`}
      />
      <Image
        src="/icons/logo-transparent-dark-1024.png"
        alt={alt}
        width={size}
        height={size}
        fetchPriority={fetchPriority}
        className={`theme-logo-dark${sharedClassName}`}
      />
    </>
  );
}
