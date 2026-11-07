"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <Brand />
      <p className="eyebrow mt-12 mb-4">A small interruption</p>
      <h1 className="page-title">Let’s give that another try.</h1>
      <p className="page-description max-w-md">
        We couldn’t load this part of your workspace. Try again, or head back to
        your overview.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw size={15} />
          Try again
        </Button>
        <Link href="/dashboard" className="secondary-link">
          Back to my workspace
        </Link>
      </div>
    </main>
  );
}
