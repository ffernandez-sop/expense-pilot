import { ExpenseDashboard } from "@/components/expense-dashboard";
import AuthGuard from "../../components/AuthGuard";

export default function DashboardPage() {
  return (  
    <AuthGuard>
      <ExpenseDashboard />
    </AuthGuard>
  );
}
