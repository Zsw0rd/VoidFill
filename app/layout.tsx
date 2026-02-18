import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/toast/Toaster";

export const metadata: Metadata = {
  title: "VoidFill",
  description: "AI-Powered Skill Gap Identifier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
