"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileText, Download, Shirt, School } from "lucide-react";
import { toast } from "sonner";
import { updateParticipant } from "@/app/actions/participants";
import { generateRAITEShirtSizesPDF, generateRAITEShirtSizesSummaryPDF } from "@/lib/pdf-reports";

interface Participant {
  id: string;
  name: string | null;
  email: string;
  school: string | null;
  role: string;
  shirtSize: string | null;
  approved: boolean;
}

interface SchoolItem {
  id: string;
  name: string;
  abbreviation: string;
}

interface ShirtSizesClientProps {
  schools: SchoolItem[];
  initialParticipants: Participant[];
}

const SHIRT_SIZES = [
  "Small (S)",
  "Medium (M)",
  "Large (L)",
  "Extra Large (XL)",
  "Double Extra Large (XXL)",
  "Triple Extra Large (XXXL)",
];

export function ShirtSizesClient({ schools, initialParticipants }: ShirtSizesClientProps) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter participants based on search and school
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = selectedSchool === "all" || p.school === selectedSchool;
    return matchesSearch && matchesSchool;
  });

  // Calculate current subset summary
  const getCounts = (list: Participant[]) => {
    const summary = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0, total: 0 };
    list.forEach((p) => {
      const size = p.shirtSize || "Extra Large (XL)";
      if (size.includes("(S)") || size === "S") summary.S++;
      else if (size.includes("(M)") || size === "M") summary.M++;
      else if (size.includes("(L)") || size === "L") summary.L++;
      else if (size.includes("(XL)") || size === "XL" || size === "Extra Large (XL)") summary.XL++;
      else if (size.includes("(XXL)") || size === "XXL" || size === "Double Extra Large (XXL)") summary.XXL++;
      else if (size.includes("(XXXL)") || size === "XXXL" || size === "Triple Extra Large (XXXL)") summary.XXXL++;
      else summary.XL++;
      summary.total++;
    });
    return summary;
  };

  const currentSummary = getCounts(filteredParticipants);

  // Generate All Schools Summaries (excluding schools with 0 total shirts)
  const getAllSchoolsSummaries = () => {
    const schoolGroups: Record<string, { S: number; M: number; L: number; XL: number; XXL: number; XXXL: number; total: number }> = {};
    
    // Group using the main list of participants to ensure completeness
    participants.forEach((p) => {
      const schoolName = p.school || "Unassigned School";
      if (!schoolGroups[schoolName]) {
        schoolGroups[schoolName] = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0, total: 0 };
      }
      
      const size = p.shirtSize || "Extra Large (XL)";
      if (size.includes("(S)") || size === "S") schoolGroups[schoolName].S++;
      else if (size.includes("(M)") || size === "M") schoolGroups[schoolName].M++;
      else if (size.includes("(L)") || size === "L") schoolGroups[schoolName].L++;
      else if (size.includes("(XL)") || size === "XL" || size === "Extra Large (XL)") schoolGroups[schoolName].XL++;
      else if (size.includes("(XXL)") || size === "XXL" || size === "Double Extra Large (XXL)") schoolGroups[schoolName].XXL++;
      else if (size.includes("(XXXL)") || size === "XXXL" || size === "Triple Extra Large (XXXL)") schoolGroups[schoolName].XXXL++;
      else schoolGroups[schoolName].XL++;
      
      schoolGroups[schoolName].total++;
    });

    return Object.entries(schoolGroups)
      .map(([schoolName, counts]) => ({
        schoolName,
        ...counts
      }))
      .filter((s) => s.total > 0)
      .sort((a, b) => a.schoolName.localeCompare(b.schoolName));
  };

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSchool]);

  const handleShirtSizeChange = async (id: string, size: string) => {
    const p = participants.find((x) => x.id === id);
    if (!p) return;

    setIsUpdating(prev => ({ ...prev, [id]: true }));
    try {
      const result = await updateParticipant(id, {
        name: p.name || "",
        email: p.email,
        shirtSize: size,
      });

      if (result.success) {
        setParticipants(prev =>
          prev.map((x) => (x.id === id ? { ...x, shirtSize: size } : x))
        );
        toast.success("Shirt size updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update shirt size");
    } finally {
      setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExportPDF = () => {
    const schoolLabel = selectedSchool === "all" ? "All Institutions" : selectedSchool;
    const pdfData = filteredParticipants.map(p => ({
      name: p.name || "N/A",
      role: p.role,
      shirtSize: p.shirtSize || "Extra Large (XL)",
    }));
    
    generateRAITEShirtSizesPDF(schoolLabel, pdfData, currentSummary);
    toast.success("Detailed report PDF generated successfully");
  };

  const handleDownloadSummary = () => {
    const summaries = getAllSchoolsSummaries();
    if (summaries.length === 0) {
      toast.error("No data available to generate summary");
      return;
    }
    generateRAITEShirtSizesSummaryPDF(summaries);
    toast.success("Consolidated summary PDF generated successfully");
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-blue-600">
            <Shirt className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Logistics & Kits</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
            Shirt Sizes <span className="text-blue-600">& Kit</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2">
            Monitor, edit, and export shirt size distributions for all school representatives.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 font-bold h-12 px-6 shadow-sm active:scale-95 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Export PDF
          </Button>
          <Button
            onClick={handleDownloadSummary}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Summary
          </Button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {[
          { label: "Small (S)", count: currentSummary.S, color: "border-blue-100 dark:border-blue-900/30" },
          { label: "Medium (M)", count: currentSummary.M, color: "border-green-100 dark:border-green-900/30" },
          { label: "Large (L)", count: currentSummary.L, color: "border-amber-100 dark:border-amber-900/30" },
          { label: "Extra Large (XL)", count: currentSummary.XL, color: "border-indigo-100 dark:border-indigo-900/30" },
          { label: "XXL", count: currentSummary.XXL, color: "border-purple-100 dark:border-purple-900/30" },
          { label: "XXXL", count: currentSummary.XXXL, color: "border-rose-100 dark:border-rose-900/30" },
          { label: "Total Shirts", count: currentSummary.total, color: "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 font-bold" },
        ].map((c, idx) => (
          <Card key={idx} className={`rounded-2xl border shadow-sm ${c.color} overflow-hidden`}>
            <div className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">{c.label}</span>
              <span className="text-2xl font-black font-mono mt-1 text-gray-900 dark:text-white">{c.count}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter and Search controls */}
      <Card className="rounded-[2rem] border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle>Logistics Registry</CardTitle>
          <CardDescription>Filter members by institutional name or keyword to perform direct shirt updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              />
            </div>
            <div className="w-full md:w-[320px]">
              <Select value={selectedSchool} onValueChange={(val) => setSelectedSchool(val || "all")}>
                <SelectTrigger className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 font-medium px-4">
                  <SelectValue placeholder="Filter by school" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 max-h-[300px]">
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.name}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableHead className="font-bold h-12 pl-6">Name</TableHead>
                  <TableHead className="font-bold h-12">Email</TableHead>
                  <TableHead className="font-bold h-12">Institution</TableHead>
                  <TableHead className="font-bold h-12">Role</TableHead>
                  <TableHead className="font-bold h-12 w-[200px]">Shirt Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-bold">
                      No members found matching the active filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedParticipants.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/20 dark:hover:bg-gray-800/20 transition-colors">
                      <TableCell className="font-bold text-gray-900 dark:text-white pl-6">
                        {p.name || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-gray-600 dark:text-gray-400">{p.email}</TableCell>
                      <TableCell className="font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-gray-400" />
                          <span>{p.school || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.role === "FACULTY_COACH" ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 font-black text-[9px] tracking-wider border">
                            COACH
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-800 font-black text-[9px] tracking-wider border">
                            COMPETITOR
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={p.shirtSize || "Extra Large (XL)"}
                          onValueChange={(val) => handleShirtSizeChange(p.id, val || "XL")}
                          disabled={isUpdating[p.id]}
                        >
                          <SelectTrigger className="h-9 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 font-medium px-3 text-xs w-[160px]">
                            {isUpdating[p.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : null}
                            <SelectValue placeholder="Shirt Size" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                            {SHIRT_SIZES.map((size) => (
                              <SelectItem key={size} value={size} className="text-xs">
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-xs text-gray-500 font-medium">
                Showing Page {currentPage} of {totalPages} ({filteredParticipants.length} total)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl font-bold h-9"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl font-bold h-9"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
