"use client";

import { useState, useEffect } from "react";
import { getBillingDashboardData, updateSchoolDiscount, getSchoolBillingData } from "@/app/actions/billing";
import { generateRAITEBillingPDF } from "@/lib/pdf-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BillingItem {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  discount: number;
  participantCount: number;
  baseBill: number;
  grandTotal: number;
}

export default function BillingManagement() {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [discounts, setDiscounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});

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
        <CardTitle>School Billing Dashboard</CardTitle>
        <CardDescription>Monitor competition finances, manage institutional discounts, and generate billing reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">School</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-center">Participants</th>
                <th className="p-2 text-right">Base Bill</th>
                <th className="p-2 text-center">Discount (PHP)</th>
                <th className="p-2 text-right">Grand Total</th>
                <th className="p-2 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2 font-medium">
                    {item.name} <span className="text-gray-400">({item.abbreviation})</span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      item.category === "MEMBER" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-2 text-center">{item.participantCount}</td>
                  <td className="p-2 text-right font-mono">
                    ₱{item.baseBill.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-2 max-w-[150px] mx-auto">
                      <Input
                        type="number"
                        value={discounts[item.id] || "0"}
                        onChange={(e) => setDiscounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="h-8 text-center"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveDiscount(item.id)}
                        disabled={saveLoading[item.id]}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                      >
                        {saveLoading[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    ₱{item.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(item)}
                      disabled={pdfLoading[item.id]}
                      className="rounded-xl font-bold"
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
