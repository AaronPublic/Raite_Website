"use client";

import { useState, useTransition } from "react";
import { User } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileDown, UserCheck, School, Loader2 } from "lucide-react";
import { generateRAITEReport } from "@/lib/pdf-reports";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCoachCategory } from "@/app/actions/coaches";
import { toast } from "sonner";

interface CoachesManagementProps {
  initialCoaches: User[];
}

function CategorySelect({ 
  coachId, 
  initialCategory, 
  onChange 
}: { 
  coachId: string; 
  initialCategory: "MEMBER" | "NON_MEMBER" | null; 
  onChange: (newCategory: "MEMBER" | "NON_MEMBER" | null) => void;
}) {
  const [category, setCategory] = useState<string>(initialCategory || "UNCLASSIFIED");
  const [isPending, startTransition] = useTransition();

  const handleChange = (val: string | null) => {
    if (!val) return;
    const dbValue = val === "UNCLASSIFIED" ? null : (val as "MEMBER" | "NON_MEMBER");
    startTransition(async () => {
      try {
        const res = await updateCoachCategory(coachId, dbValue);
        if (res.success) {
          setCategory(val);
          onChange(dbValue);
          toast.success("Coach classification updated.");
        } else {
          toast.error("Failed to update classification.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update classification.");
      }
    });
  };

  return (
    <div className="w-[160px]">
      <Select value={category} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className={cn(
          "h-9 rounded-xl font-bold text-xs px-3 border transition-all shrink-0",
          category === "MEMBER" 
            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            : category === "NON_MEMBER"
              ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-850"
              : "border-gray-200 text-gray-500 dark:text-gray-400 dark:border-gray-800"
        )}>
          {isPending ? (
            <div className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</div>
          ) : (
            <SelectValue>
              {category === "NON_MEMBER" ? "NON-MEMBER" : category === "MEMBER" ? "MEMBER" : "UNCLASSIFIED"}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent className="rounded-xl border-gray-150 dark:border-gray-800">
          <SelectItem value="UNCLASSIFIED" className="text-xs font-bold text-gray-500">UNCLASSIFIED</SelectItem>
          <SelectItem value="MEMBER" className="text-xs font-bold text-blue-600 dark:text-blue-400">MEMBER</SelectItem>
          <SelectItem value="NON_MEMBER" className="text-xs font-bold text-orange-600 dark:text-orange-400">NON-MEMBER</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function CoachesManagement({ initialCoaches }: CoachesManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [coaches, setCoaches] = useState<User[]>(initialCoaches);

  const handleCategoryChange = (coachId: string, newCategory: "MEMBER" | "NON_MEMBER" | null) => {
    setCoaches(prev => prev.map(c => c.id === coachId ? { ...c, category: newCategory } : c));
  };

  // Filter coaches based on query
  const filteredCoaches = coaches.filter(
    (coach) =>
      (coach.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coach.school || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coach.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPDF = () => {
    const columns = ["Classification", "Name", "Email Address", "Role", "Educational Institution"];
    const data = filteredCoaches.map((c) => [
      c.category === "MEMBER" ? "MEMBER" : c.category === "NON_MEMBER" ? "NON-MEMBER" : "UNCLASSIFIED",
      c.name || "N/A",
      c.email,
      c.role === "SUB_ADMIN" ? "Sub-Admin" : "Faculty Coach",
      c.school || "N/A"
    ]);

    generateRAITEReport({
      title: "RAITE 2026 - Faculty Coaches Registry",
      subtitle: "List of registered institutional faculty coaches and category classifications.",
      filename: "RAITE2026_FACULTY_COACHES",
      columns,
      data
    });
  };

  return (
    <div className="space-y-12">
      {/* Upper Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-blue-600">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Institutional Leaders</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
            Faculty <span className="text-blue-600">Coaches</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2">
            Verify official representatives, view classifications, and export registry reports.
          </p>
        </div>

        <Button
          onClick={handleExportPDF}
          className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/20 flex items-center gap-2.5 px-6 self-start md:self-center transition-all hover:scale-102"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <Card className="rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Coaches Registry</CardTitle>
              <CardDescription>All registered faculty coaches grouped by their school affiliation.</CardDescription>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search coach or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 font-medium text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 border-b-2 border-gray-100 dark:border-gray-800 hover:bg-transparent">
                  <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-8">Category Status</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-8">Name</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Email Address</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Role</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">School Affiliation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoaches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                      No faculty coaches or sub-admins found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoaches.map((coach) => (
                    <TableRow
                      key={coach.id}
                      className="h-20 transition-all border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                    >
                      <TableCell className="px-8">
                        <CategorySelect 
                          coachId={coach.id} 
                          initialCategory={coach.category} 
                          onChange={(newCat) => handleCategoryChange(coach.id, newCat)}
                        />
                      </TableCell>
                      <TableCell className="px-8 font-bold text-gray-900 dark:text-white">
                        {coach.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-6 text-sm font-medium text-gray-500">
                        {coach.email}
                      </TableCell>
                      <TableCell className="px-6 text-sm font-medium">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          coach.role === "SUB_ADMIN"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        )}>
                          {coach.role === "SUB_ADMIN" ? "Sub-Admin" : "Faculty Coach"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        <span className="inline-flex items-center gap-2">
                          <School className="w-4 h-4 text-gray-400 shrink-0" />
                          {coach.school || "Unassigned"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
