import Image from "next/image";
import logoSrc from "../../public/logo.webp";

/**
 * The OF Felni wordmark. Height is set by the caller; width follows the 2.19:1 aspect.
 * `priority` because it sits in the header and is always above the fold.
 */
export function Logo({ className = "h-9 lg:h-12" }: { className?: string }) {
  return (
    <Image
      src={logoSrc}
      alt="Oli Felni"
      priority
      className={`w-auto ${className}`}
      sizes="240px"
    />
  );
}
