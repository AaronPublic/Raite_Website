"use client";

import { useState, useEffect } from "react";
import { getBillingDashboardData, updateSchoolDiscount, getSchoolBillingData, toggleSchoolPaymentStatus } from "@/app/actions/billing";
import { generateRAITEBillingPDF } from "@/lib/pdf-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Save, Loader2, Search, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BillingItem {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  discount: number;
  billingPaid: boolean;
  participantCount: number;
  baseBill: number;
  grandTotal: number;
}

export default function BillingManagement() {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [discounts, setDiscounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState<Record<string, boolean>>({});
  const [payLoading, setPayLoading] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    try {
      const data = await getBillingDashboardData();
      setItems(data);
      const discMap: Record<string, string> = {};
      data.forEach(item => {
        discMap[item.id] = item.discount.toString();
      });
      setDiscounts(discMap);
    } catch (err) {
      toast.error("Failed to load billing dashboard items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset page to 1 when search filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSaveDiscount = async (id: string) => {
    const discountVal = parseFloat(discounts[id] || "0");
    if (isNaN(discountVal) || discountVal < 0) {
      toast.error("Discount must be a positive number");
      return;
    }

    setSaveLoading(prev => ({ ...prev, [id]: true }));
    const res = await updateSchoolDiscount(id, discountVal);
    setSaveLoading(prev => ({ ...prev, [id]: false }));

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Discount updated successfully");
      loadData();
    }
  };

  const handleTogglePayment = async (id: string) => {
    setPayLoading(prev => ({ ...prev, [id]: true }));
    const res = await toggleSchoolPaymentStatus(id);
    setPayLoading(prev => ({ ...prev, [id]: false }));

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Payment status updated successfully");
      loadData();
    }
  };

  const handleDownloadPDF = async (item: BillingItem) => {
    setPdfLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      const fullData = await getSchoolBillingData(item.id);
      generateRAITEBillingPDF(fullData);
      toast.success("Invoice PDF generated");
    } catch (err) {
      toast.error("Failed to generate PDF billing invoice");
    } finally {
      setPdfLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate filtered items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate Total Confirmed Paid
  const totalPaid = items
    .filter(item => item.billingPaid)
    .reduce((sum, item) => sum + item.grandTotal, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>School Billing Dashboard</CardTitle>
            <CardDescription>Monitor competition finances, manage institutional discounts, and generate billing reports.</CardDescription>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 p-4 rounded-2xl flex flex-col justify-center items-end sm:min-w-[200px] shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-400">Total Confirmed Paid</span>
            <span className="text-2xl font-black text-green-700 dark:text-green-400 font-mono mt-0.5">
              ₱{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search school name or abbreviation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto w-full border rounded-xl">
          <table className="w-full text-sm min-w-[950px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-center">Participants</th>
                <th className="p-3 text-right">Base Bill</th>
                <th className="p-3 text-center">Discount (PHP)</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    No schools found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3 font-semibold">
                      {item.name} <span className="text-gray-400 font-normal">({item.abbreviation})</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        item.category === "MEMBER" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300">{item.participantCount}</td>
                    <td className="p-3 text-right font-mono text-gray-600 dark:text-gray-400">
                      ₱{item.baseBill.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2 max-w-[150px] mx-auto">
                        <Input
                          type="number"
                          value={discounts[item.id] || "0"}
                          onChange={(e) => setDiscounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="h-8 text-center rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveDiscount(item.id)}
                          disabled={saveLoading[item.id]}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                          {saveLoading[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                      ₱{item.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleTogglePayment(item.id)}
                        disabled={payLoading[item.id]}
                        className={`rounded-xl font-bold h-9 w-24 border ${
                          item.billingPaid
                            ? "bg-green-100 hover:bg-green-200 text-green-800 border-green-200"
                            : "bg-red-50 hover:bg-red-100 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50"
                        }`}
                      >
                        {payLoading[item.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : item.billingPaid ? (
                          <span className="flex items-center justify-center gap-1">
                            <Check className="w-4 h-4 text-green-700" /> Paid
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Unpaid
                          </span>
                        )}
                      </Button>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(item)}
                        disabled={pdfLoading[item.id]}
                        className="rounded-xl font-bold h-9"
                      >
                        {pdfLoading[item.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-1 text-red-500" /> Bill PDF
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} schools
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl font-bold h-9"
            >
              Previous
            </Button>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="rounded-xl font-bold h-9"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
