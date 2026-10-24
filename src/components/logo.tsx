import Image from "next/image";
import logoSrc from "../../public/logo.webp";
import logoDarkSrc from "../../public/logo-dark.webp";

/**
 * The OF Felni wordmark. Height is set by the caller; width follows the 2.19:1 aspect.
 * `priority` because it sits in the header and is always above the fold.
 *
 * The dark variant is the original with its lightness inverted, so the black wordmark
 * reads white while the red survives. Swapped in CSS rather than from React state: the
 * theme is applied before hydration, and a state-driven swap would flash the wrong one.
 */
export function Logo({ className = "h-9 lg:h-12" }: { className?: string }) {
  return (
    <>
      <Image
        src={logoSrc}
        alt="Oli Felni"
        priority
        className={`w-auto dark:hidden ${className}`}
        sizes="240px"
      />
      <Image
        src={logoDarkSrc}
        alt="Oli Felni"
        priority
        className={`hidden w-auto dark:block ${className}`}
        sizes="240px"
      />
    </>
  );
}
