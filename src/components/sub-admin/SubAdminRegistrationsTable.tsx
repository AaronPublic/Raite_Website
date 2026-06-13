"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Loader2,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  Globe
} from "lucide-react";
import { updateRegistrationStatus } from "@/app/actions/registrations";
import { getRegistrationDetails } from "@/app/actions/reports";
import EntryUrlEditor from "@/components/registration/EntryUrlEditor";
import { RegistrationStatus, EventSubcategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SubAdminExportButtons from "./SubAdminExportButtons";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface Registration {
  id: string;
  status: RegistrationStatus;
  teamName: string | null;
  requirements: any;
  requirementsVerified: boolean;
  entryUrl: string | null;
  createdAt: string;
  adminComment: string | null;
  user: {
    name: string | null;
    email: string;
    school: string | null;
  };
  event: {
    id: string;
    title: string;
    subcategory: EventSubcategory | null;
  };
}

function RejectionModal({ 
  registration, 
  onReject, 
  isUpdating 
}: { 
  registration: Registration; 
  onReject: (id: string, comment: string) => Promise<void>;
  isUpdating: boolean;
}) {
  const [comment, setComment] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    await onReject(registration.id, comment);
    setIsOpen(false);
    setComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          disabled={isUpdating}
        >
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Reject Registration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Please provide a reason for rejecting this registration. This comment will be visible to the participant.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Rejection Reason</label>
            <Textarea 
              placeholder="e.g., Missing valid ID, Incorrect documentation..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-xl border-gray-200 min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleSubmit} 
              disabled={isUpdating}
              className="rounded-xl font-bold gap-2"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirm Rejection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RegistrationDetailsModal({ 
  registration,
  onStatusUpdate,
  isUpdating
}: { 
  registration: Registration;
  onStatusUpdate: (id: string, status: RegistrationStatus, comment?: string) => Promise<void>;
  isUpdating: string | null;
}) {
  const [details, setDetails] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getRegistrationDetails(registration.id);
      setDetails(data);
    } catch (error) {
      toast.error("Failed to load registration details");
    } finally {
      setIsLoading(false);
    }
  };

  const requirements = typeof registration.requirements === 'string' 
    ? JSON.parse(registration.requirements) 
    : registration.requirements;
    
  const documentEntries = !Array.isArray(requirements) && typeof requirements === 'object' && requirements !== null
    ? Object.entries(requirements).filter(([key]) => !['participants', 'members', 'repName', 'repContact', 'repEmail'].includes(key))
    : [];

  const loading = isUpdating === registration.id;
  const isOnlineRelevant = registration.event.subcategory === "ONLINE" || registration.event.subcategory === "ONSITE_PAGEANT";
  const isPageant = registration.event.subcategory === "ONSITE_PAGEANT";

  return (
    <Dialog onOpenChange={(open) => {
      if (open) {
        fetchDetails();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors">
          <Eye className="h-3.5 w-3.5" /> View Details
        </Button>
      </DialogTrigger>
      
      {/* Optimized Modal Outer Shell */}
      <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl h-[90vh] flex flex-col rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300 no-scrollbar">
        
        {/* Pinned Sticky Header */}
        <DialogHeader className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-6 md:px-12 md:py-8 flex flex-row items-center justify-between gap-4 shrink-0">
          <div className="space-y-1 md:space-y-2 min-w-0">
            <DialogTitle className="text-xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white truncate">
              Registration Details
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Badge variant="outline" className="font-bold text-[9px] md:text-[11px] uppercase tracking-wider px-2.5 py-1 md:px-4 md:py-1.5 border-blue-200 text-blue-600 bg-blue-50/50 rounded-full">
                {registration.event.title}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "font-bold text-[9px] md:text-[11px] uppercase tracking-wider px-2.5 py-1 md:px-4 md:py-1.5 rounded-full border-2",
                  registration.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" : 
                  registration.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" : 
                  "bg-blue-50 text-blue-700 border-blue-100"
                )}
              >
                {registration.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {registration.status !== "APPROVED" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl md:rounded-2xl font-bold gap-1.5 md:gap-2 px-3 h-9 md:px-8 md:h-12 shadow-lg shadow-green-600/20 transition-all text-xs md:text-base"
                onClick={() => onStatusUpdate(registration.id, "APPROVED")}
                disabled={!!isUpdating}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 md:h-5 md:w-5" />}
                <span className="hidden sm:inline">Approve Entry</span>
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {/* Isolated Scroll Space Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:p-12 no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-50 rounded-full" />
                <Loader2 className="h-20 w-20 animate-spin text-blue-600 absolute top-0 left-0 stroke-[3]" />
              </div>
              <p className="text-base font-black text-gray-400 uppercase tracking-[0.25em] animate-pulse">Initializing Data Stream</p>
            </div>
          ) : (
            <div className="space-y-12">
              {registration.adminComment && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-50/40 border border-dashed border-amber-200 p-8 rounded-[2.5rem] flex gap-8 shadow-sm"
                >
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-[11px] font-black uppercase text-amber-600 tracking-wider mb-2">Administrative Remarks</p>
                    <p className="text-base font-medium text-amber-900/80 leading-relaxed max-w-5xl">{registration.adminComment}</p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className={cn("bg-gray-50/50 dark:bg-gray-800/50 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-8", isOnlineRelevant ? "xl:col-span-7" : "xl:col-span-12")}>
                  <div className="flex items-center gap-5 mb-2">
                    <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-50 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">Profile Overview</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Institution</p>
                      <p className="font-black text-2xl text-gray-900 dark:text-white leading-tight uppercase tracking-tight">{registration.user.school || "N/A"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Team Alias</p>
                      <p className="font-black text-2xl text-gray-900 dark:text-white leading-tight tracking-tight">{registration.teamName || "N/A"}</p>
                    </div>

                    {isPageant && (
                      <div className="md:col-span-2 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4">
                        <p className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          School Representative
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Full Name</p>
                              <p className="font-black text-gray-900 dark:text-white">{requirements.repName || "N/A"}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Contact Number</p>
                              <p className="font-black text-gray-900 dark:text-white">{requirements.repContact || "N/A"}</p>
                           </div>
                           <div className="md:col-span-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Email Address</p>
                              <p className="font-black text-gray-900 dark:text-white">{requirements.repEmail || "N/A"}</p>
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2 pt-8 border-t border-gray-200/50">
                      <p className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-6">Faculty Liaison</p>
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-600/20">
                          {(details?.coach?.name || registration.user.name || "?").charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{details?.coach?.name || registration.user.name}</p>
                          <p className="text-base text-gray-500 font-bold">{details?.coach?.email || registration.user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isOnlineRelevant && (
                  <div className="xl:col-span-5 bg-blue-600 p-10 rounded-[2.5rem] shadow-xl shadow-blue-600/20 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider">{isPageant ? "Pageant Assets" : "Online Asset"}</h3>
                      </div>
                      <p className="text-sm text-blue-100 mb-8 leading-relaxed max-w-sm">
                        {isPageant ? "Verification of 3R photos required for male and female participants." : "Verification of digital entry required. Submission URL maintains exclusive override status."}
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-inner relative z-10">
                      {isPageant ? (
                         <div className="flex flex-col gap-3">
                           {(() => {
                             if (!registration.entryUrl) return <span className="text-blue-100 italic text-sm">No photos submitted.</span>;
                             try {
                               const parsed = JSON.parse(registration.entryUrl);
                               return (
                                 <>
                                   <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-white/10">
                                      <span className="text-[9px] font-black uppercase text-blue-200">Male Photo</span>
                                      <a href={parsed.malePhoto} target="_blank" rel="noopener noreferrer" className="text-white font-black hover:underline text-xs truncate">
                                        {parsed.malePhoto}
                                      </a>
                                   </div>
                                   <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-white/10">
                                      <span className="text-[9px] font-black uppercase text-blue-200">Female Photo</span>
                                      <a href={parsed.femalePhoto} target="_blank" rel="noopener noreferrer" className="text-white font-black hover:underline text-xs truncate">
                                        {parsed.femalePhoto}
                                      </a>
                                   </div>
                                 </>
                               );
                             } catch {
                               return <span className="text-white text-xs font-bold">Invalid submission format.</span>;
                             }
                           })()}
                         </div>
                      ) : (
                        <EntryUrlEditor registrationId={registration.id} initialEntryUrl={registration.entryUrl} />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white dark:text-gray-900" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">Active Roster</h3>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-8 py-4 rounded-[2rem] flex items-center gap-5 shadow-inner">
                    <span className="text-4xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{details?.memberDetails?.length || 0}</span>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider leading-tight">Confirmed<br/>Personnel</span>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl bg-white dark:bg-gray-900">
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
                      <TableRow className="hover:bg-transparent border-b h-16">
                        <TableHead className="font-black uppercase tracking-wider text-[11px] px-12">Candidate Identity</TableHead>
                        <TableHead className="font-black uppercase tracking-wider text-[11px] px-12">Communication</TableHead>
                        <TableHead className="font-black uppercase tracking-wider text-[11px] px-12 text-right">System ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details?.memberDetails?.length > 0 ? (
                        details.memberDetails.map((m: any, i: number) => (
                          <TableRow key={i} className="h-20 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all duration-300 border-b last:border-none group">
                            <TableCell className="px-12">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-gray-400 text-base shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  {m.name?.charAt(0)}
                                </div>
                                <span className="font-black text-xl text-gray-900 dark:text-white tracking-tight group-hover:translate-x-1 transition-transform">{m.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-12 font-medium text-gray-500 text-base">{m.email}</TableCell>
                            <TableCell className="px-12 text-right">
                              <Badge variant="outline" className="font-mono text-[11px] px-4 py-1.5 rounded-xl bg-gray-50/50 border-gray-200 text-blue-600 font-black shadow-sm">
                                {m.id}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-300 py-24 font-black uppercase tracking-[0.4em] text-base">
                            Null Roster Detected
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-8 pb-6">
                <div className="flex items-center gap-5 px-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">Document Repository</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {documentEntries.length > 0 ? (
                    documentEntries.map(([name, url]: any, i: number) => (
                      <motion.a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-6 p-6 rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10 transition-all group relative overflow-hidden"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                          <FileText className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col min-w-0 relative z-10">
                          <span className="text-base font-black uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                            {name.replace(/([A-Z])/g, " $1").replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Institutional Audit Document</span>
                        </div>
                      </motion.a>
                    ))
                  ) : (
                    <div className="col-span-full bg-gray-50/50 p-20 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-6 shadow-inner">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <p className="text-base font-black text-gray-400 uppercase tracking-widest">Archive Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SubAdminRegistrationsTable({ initialData, eventId }: { initialData: Registration[], eventId: string }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: RegistrationStatus, comment?: string) => {
    setIsUpdating(id);
    const result = await updateRegistrationStatus({ id, status, comment });
    if (result.success) {
      toast.success(`Registration ${status.toLowerCase()}`);
      router.refresh();
    } else {
      toast.error(result.error || "Update failed");
    }
    setIsUpdating(null);
  };

  const columns: ColumnDef<Registration>[] = [
    {
      accessorKey: "user.school",
      header: "School / Institution",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
          {row.original.user.school || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Registered On",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as RegistrationStatus;
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border-2",
              status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" : 
              status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" : 
              status === "PENDING" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30" : 
              "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "details",
      header: "View",
      cell: ({ row }) => (
        <RegistrationDetailsModal 
          registration={row.original} 
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const reg = row.original;
        const loading = isUpdating === reg.id;
        
        return (
          <div className="flex items-center gap-2">
            {reg.status !== "APPROVED" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                onClick={() => handleStatusUpdate(reg.id, "APPROVED")}
                disabled={!!isUpdating}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </Button>
            )}
            {reg.status !== "REJECTED" && (
              <RejectionModal 
                registration={reg} 
                onReject={(id, comment) => handleStatusUpdate(id, "REJECTED", comment)} 
                isUpdating={!!isUpdating}
              />
            )}
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data: initialData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SubAdminExportButtons eventId={eventId} />
      </div>
      <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50/50 dark:bg-gray-800/30 border-b-2 border-gray-100 dark:border-gray-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-20 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                  No registrations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
