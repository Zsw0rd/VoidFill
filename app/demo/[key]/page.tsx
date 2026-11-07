import { notFound } from "next/navigation";
import { validDemoKey } from "@/lib/demo/server";
import { DemoEntry } from "./ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Private demo · VoidFill", robots: { index: false, follow: false } };
export default async function DemoPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!validDemoKey(key)) notFound();
  return <DemoEntry entryKey={key} />;
}
