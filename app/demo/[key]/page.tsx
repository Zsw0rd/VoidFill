import { notFound } from "next/navigation";
import { validDemoKey } from "@/lib/demo/server";
import { DemoEntry } from "./ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Private demo · VoidFill", robots: { index: false, follow: false } };
export default function DemoPage({ params }: { params: { key: string } }) {
  if (!validDemoKey(params.key)) notFound();
  return <DemoEntry entryKey={params.key} />;
}
