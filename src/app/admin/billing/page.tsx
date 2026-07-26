import BillingManagement from "@/components/admin/BillingManagement";
import { CreditCard } from "lucide-react";

export default function AdminBillingPage() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-blue-600">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.3em]">Financial Center</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
          School <span className="text-blue-600">Billing</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2">Manage institutional invoices, membership status, and discounts.</p>
      </div>

      <BillingManagement />
    </div>
  );
}
