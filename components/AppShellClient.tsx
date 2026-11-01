"use client";
import { WorkspaceShell } from "./WorkspaceShell";
export function AppShellClient({
  displayName,
  children,
}: {
  displayName: string;
  children: React.ReactNode;
}) {
  return <WorkspaceShell displayName={displayName}>{children}</WorkspaceShell>;
}
