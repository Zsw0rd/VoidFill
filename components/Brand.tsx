import Link from "next/link";
import { Aperture } from "lucide-react";
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="VoidFill home">
      <span className="brand-mark">
        <Aperture size={32} strokeWidth={2.3} />
      </span>
      voidfill<span className="text-rust">.</span>
    </Link>
  );
}
