"use client";
import { WorkspaceShell } from "./WorkspaceShell";
export function AdminShellClient({
  displayName,
  role,
  learnerAccess,
  children,
}: {
  displayName: string;
  role: string;
  learnerAccess?: boolean;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell displayName={displayName} role={role} learnerAccess={learnerAccess}>
      {children}
    </WorkspaceShell>
  );
}
