import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/Brand";
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <Brand />
      <p className="eyebrow mt-12 mb-4">404 / A different direction</p>
      <h1 className="page-title">This path doesn’t lead anywhere.</h1>
      <p className="page-description max-w-md">
        The page may have moved, or this link may no longer be available.
        There’s still plenty to explore.
      </p>
      <Link href="/" className="primary-link mt-7">
        Back to the beginning
        <ArrowRight size={15} />
      </Link>
    </main>
  );
}
