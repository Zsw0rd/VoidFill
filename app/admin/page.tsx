import { redirect } from "next/navigation";

// Old admin page redirects to new admin dashboard
export default function AdminPage() {
  redirect("/admin/dashboard");
}
