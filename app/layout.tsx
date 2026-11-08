import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/toast/Toaster";
import { DemoSession } from "@/components/DemoSession";
import { AssessmentDraftBoundary } from "@/components/AssessmentDraftBoundary";

export const metadata: Metadata = {
  title: "VoidFill",
  description: "AI-Powered Skill Gap Identifier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <DemoSession />
        <AssessmentDraftBoundary />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
