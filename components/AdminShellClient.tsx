"use client";
import { WorkspaceShell } from "./WorkspaceShell";
export function AdminShellClient({
  displayName,
  role,
  children,
}: {
  displayName: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell displayName={displayName} role={role}>
      {children}
    </WorkspaceShell>
  );
}
