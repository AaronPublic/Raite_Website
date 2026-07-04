"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegistrationStatus, EventSubcategory } from "@prisma/client";
import { Pencil, Send, CheckCircle, ExternalLink, Globe, Loader2, AlertCircle, ArrowUpDown, ChevronDown, Users, Upload } from "lucide-react";
import Link from "next/link";
import { submitEntryUrl } from "@/app/actions/registration";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Registration {
  id: string;
  status: RegistrationStatus;
  teamName: string | null;
  entryUrl: string | null;
  createdAt: Date;
  members: any;
  adminComment: string | null;
  user: {
    school: string | null;
  };
  event: {
    id: string;
    title: string;
    subcategory: EventSubcategory | null;
  };
}

interface Participant {
  id: string;
  name: string | null;
  email: string;
  uniqueId: string | null;
  approved: boolean;
}

export function MyRegistrationsTable({ 
  registrations,
  participants = []
}: { 
  registrations: Registration[];
  participants?: Participant[];
}) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null);

  const participantsMap = React.useMemo(() => {
    const map: Record<string, Participant> = {};
    participants.forEach((p) => {
      map[p.email.toLowerCase()] = p;
    });
    return map;
  }, [participants]);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedMalePhotoFile, setSelectedMalePhotoFile] = React.useState<File | null>(null);
  const [selectedFemalePhotoFile, setSelectedFemalePhotoFile] = React.useState<File | null>(null);
  const [openDialog, setOpenDialog] = React.useState<string | null>(null);
  const [confirmSubmitId, setConfirmSubmitId] = React.useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = React.useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, targetField: "entryUrl" | "malePhoto" | "femalePhoto") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1GB maximum limit)
    if (file.size > 1 * 1024 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 1GB.");
      e.target.value = "";
      return;
    }

    if (targetField === "entryUrl") setSelectedFile(file);
    if (targetField === "malePhoto") setSelectedMalePhotoFile(file);
    if (targetField === "femalePhoto") setSelectedFemalePhotoFile(file);
    toast.success(`Selected file: ${file.name}`);
    e.target.value = "";
  };

  const uploadFileViaApi = async (formData: FormData) => {
    const response = await fetch("/api/upload/entry", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to upload file to Google Drive" };
    }
    return await response.json();
  };

  const handleSubmitEntry = async (registrationId: string, subcategory: EventSubcategory | null) => {
    let submissionData = "";
    
    setIsSubmitting(registrationId);
    const toastId = toast.loading("Uploading files and submitting entry...");
    try {
      if (subcategory === "ONSITE_PAGEANT") {
        if (!selectedMalePhotoFile || !selectedFemalePhotoFile) {
          toast.error("Please select both photo files", { id: toastId });
          setIsSubmitting(null);
          return;
        }

        // Upload male photo
        const maleFormData = new FormData();
        maleFormData.append("file", selectedMalePhotoFile);
        maleFormData.append("registrationId", registrationId);
        const maleResult = await uploadFileViaApi(maleFormData);
        if (!maleResult.success || !maleResult.link) {
          toast.error(maleResult.error || "Failed to upload male photo to Google Drive", { id: toastId });
          setIsSubmitting(null);
          return;
        }

        // Upload female photo
        const femaleFormData = new FormData();
        femaleFormData.append("file", selectedFemalePhotoFile);
        femaleFormData.append("registrationId", registrationId);
        const femaleResult = await uploadFileViaApi(femaleFormData);
        if (!femaleResult.success || !femaleResult.link) {
          toast.error(femaleResult.error || "Failed to upload female photo to Google Drive", { id: toastId });
          setIsSubmitting(null);
          return;
        }

        submissionData = JSON.stringify({ 
          malePhoto: maleResult.link, 
          femalePhoto: femaleResult.link 
        });
      } else {
        if (!selectedFile) {
          toast.error("Please select a file to upload", { id: toastId });
          setIsSubmitting(null);
          return;
        }

        // Upload entry file
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);
        fileFormData.append("registrationId", registrationId);
        const fileResult = await uploadFileViaApi(fileFormData);
        if (!fileResult.success || !fileResult.link) {
          toast.error(fileResult.error || "Failed to upload file to Google Drive", { id: toastId });
          setIsSubmitting(null);
          return;
        }

        submissionData = fileResult.link;
      }

      const result = await submitEntryUrl(registrationId, submissionData);
      if (result.success) {
        toast.success("Entry submitted successfully!", { id: toastId });
        setOpenDialog(null);
        setSelectedFile(null);
        setSelectedMalePhotoFile(null);
        setSelectedFemalePhotoFile(null);
      } else {
        toast.error(result.error || "Failed to submit entry", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during submission", { id: toastId });
    } finally {
      setIsSubmitting(null);
    }
  };

  const columns: ColumnDef<Registration>[] = [
    {
      accessorKey: "event.title",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-0 font-black uppercase tracking-widest text-[10px]">
          Competition <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-gray-900 dark:text-white leading-tight">{row.original.event.title}</span>
          <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600 mt-1 flex items-center gap-1">
             <Globe className="w-3 h-3" />
             {row.original.event.subcategory?.replace("_", " ")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "user.school",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-0 font-black uppercase tracking-widest text-[10px]">
          Institution <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {row.original.user?.school || "N/A"}
        </span>
      ),
    },
    {
      id: "teamMembers",
      header: () => <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">Team Members</span>,
      cell: ({ row }) => {
        const membersList = (row.original.members as string[]) || [];
        if (!membersList || membersList.length === 0) {
          return <span className="text-xs text-gray-400 italic">No registered members</span>;
        }

        return (
          <Popover 
            open={openPopoverId === row.original.id}
            onOpenChange={(open) => setOpenPopoverId(open ? row.original.id : null)}
          >
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 gap-2 font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-[0.98] bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>View Team ({membersList.length})</span>
                <ChevronDown className="w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              onClick={() => setOpenPopoverId(null)}
              className="w-[320px] p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-200 cursor-pointer" 
              align="start"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Registered Members</span>
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600 border-0 text-[10px] font-black h-5 px-2">
                    {membersList.length} total
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto no-scrollbar">
                  {membersList.map((email) => {
                    const p = participantsMap[email.toLowerCase()];
                    return (
                      <div key={email} className="flex flex-col text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0 pb-2 last:pb-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {p?.name || "Pending Account"}
                          </span>
                          {p?.uniqueId && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black bg-blue-50/50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                              {p.uniqueId}
                            </Badge>
                          )}
                          {p ? (
                            p.approved ? (
                              <Badge className="h-4 px-1 text-[8px] font-black bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 shrink-0 rounded-md">
                                APPROVED
                              </Badge>
                            ) : (
                              <Badge className="h-4 px-1 text-[8px] font-black bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 shrink-0 rounded-md">
                                UNAPPROVED
                              </Badge>
                            )
                          ) : (
                            <Badge className="h-4 px-1 text-[8px] font-black bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 shrink-0 rounded-md">
                              UNREGISTERED
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{email}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-0 font-black uppercase tracking-widest text-[10px]">
          Approval Status <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status as RegistrationStatus;
        const adminComment = row.original.adminComment;
        const isToReview = status === "REJECTED";
        const popoverId = `status-${row.original.id}`;

        if (isToReview) {
          return (
            <Popover
              open={openPopoverId === popoverId}
              onOpenChange={(open) => setOpenPopoverId(open ? popoverId : null)}
            >
              <PopoverTrigger asChild>
                <button className={cn(
                  "inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2 cursor-pointer transition-all active:scale-95",
                  "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30 shadow-sm shadow-yellow-100",
                  "hover:bg-yellow-100 hover:border-yellow-300 dark:hover:bg-yellow-900/30"
                )}>
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  To Review
                  <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                onClick={() => setOpenPopoverId(null)}
                className="w-[280px] p-4 rounded-2xl shadow-xl border border-yellow-100 dark:border-yellow-900/50 bg-white dark:bg-gray-900 cursor-pointer"
                align="start"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-yellow-100 dark:border-yellow-900/50 pb-2">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
                      Review Required
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                    {adminComment || "No specific reason provided. Please contact your sub-admin for details."}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2 w-fit",
              status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 shadow-sm shadow-green-100" :
              status === "PENDING" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 shadow-sm shadow-blue-100" :
              "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            )}
          >
            {status}
          </Badge>
        );
      },

    },
    {
      id: "entryStatus",
      header: "Entry Status",
      cell: ({ row }) => {
        const isOnline = row.original.event.subcategory === "ONLINE";
        const isPageant = row.original.event.subcategory === "ONSITE_PAGEANT";
        if (!isOnline && !isPageant) return <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">N/A</span>;
        
        const hasSubmitted = !!row.original.entryUrl;
        const isApproved = row.original.status === "APPROVED";

        return (
          <div className="flex items-center gap-3">
            {hasSubmitted ? (
              <Badge className="bg-green-600 hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full gap-1.5 border-0 shadow-sm shadow-green-100">
                <CheckCircle className="w-3.5 h-3.5" />
                Submitted
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2">
                Not Submitted
              </Badge>
            )}

            {(isOnline || isPageant) && isApproved && !hasSubmitted && (
              <Dialog 
                open={openDialog === row.original.id} 
                onOpenChange={(open) => {
                  if (open) {
                    setOpenDialog(row.original.id);
                    setSelectedFile(null);
                    setSelectedMalePhotoFile(null);
                    setSelectedFemalePhotoFile(null);
                  } else {
                    setOpenDialog(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="rounded-xl font-bold gap-2 h-8 px-3 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 text-[11px]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-xl rounded-[2rem] p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-gray-900 transition-all duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
                  <DialogHeader className="space-y-3 md:space-y-4">
                    <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                      {isPageant ? "Submit Pageant Photos" : "Submit Competition Entry"}
                    </DialogTitle>
                    <DialogDescription asChild className="font-medium space-y-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      <div>
                        {isPageant && (
                          <div className="space-y-3">
                            <p>Provide the Google Drive links to the 3R photos.</p>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800 text-xs">
                              <p className="font-black uppercase text-[9px] mb-0.5 tracking-widest">3R Photo Size</p>
                              <p className="leading-tight">Standard 3.5 x 5 inches (8.9 x 12.7 cm).</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3 p-4 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 items-start mt-4">
                          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-100">
                              Important Notice
                            </p>
                            <p className="text-[11px] sm:text-xs font-medium leading-normal text-justify">
                              Submission is allowed only once. No further edits or modifications can be made after submission. For multi-file submission, archive the files through zip format. For submissions with more than 1GB of file size, upload the file to google drive, make sure that permissions are set to EVERYONE. Put the shareable link to a .txt file and upload.
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-3 md:py-4">
                    {isPageant ? (
                      <div className="space-y-6">
                        <div className="space-y-2 animate-none">
                          <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-500">Male Participant 3R Photo</Label>
                          {selectedMalePhotoFile ? (
                            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border-2 border-green-100 dark:border-green-900/30 flex items-center justify-between gap-4">
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase text-green-700 dark:text-green-400 tracking-wider">File Selected</span>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate mt-1">
                                  {selectedMalePhotoFile.name} ({(selectedMalePhotoFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                              <label className="flex items-center justify-center h-10 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer shrink-0 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                <Upload className="w-4 h-4 text-gray-500" />
                                <span className="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Change Photo</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/png, image/jpeg, image/jpg"
                                  onChange={(e) => handleFileSelect(e, "malePhoto")}
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/20">
                              <Upload className="w-6 h-6 text-gray-400 mb-1" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Click to select male participant photo
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={(e) => handleFileSelect(e, "malePhoto")}
                              />
                            </label>
                          )}
                        </div>

                        <div className="space-y-2 animate-none">
                          <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-500">Female Participant 3R Photo</Label>
                          {selectedFemalePhotoFile ? (
                            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border-2 border-green-100 dark:border-green-900/30 flex items-center justify-between gap-4">
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase text-green-700 dark:text-green-400 tracking-wider">File Selected</span>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate mt-1">
                                  {selectedFemalePhotoFile.name} ({(selectedFemalePhotoFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                              <label className="flex items-center justify-center h-10 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer shrink-0 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                <Upload className="w-4 h-4 text-gray-500" />
                                <span className="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Change Photo</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/png, image/jpeg, image/jpg"
                                  onChange={(e) => handleFileSelect(e, "femalePhoto")}
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/20">
                              <Upload className="w-6 h-6 text-gray-400 mb-1" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Click to select female participant photo
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={(e) => handleFileSelect(e, "femalePhoto")}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-none">
                        <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-500">File Submission</Label>
                        {selectedFile ? (
                          <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border-2 border-green-100 dark:border-green-900/30 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black uppercase text-green-700 dark:text-green-400 tracking-wider">File Selected</span>
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate mt-1">
                                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                            <label className="flex items-center justify-center h-10 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer shrink-0 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                              <Upload className="w-4 h-4 text-gray-500" />
                              <span className="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Change File</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, "entryUrl")}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-550 hover:bg-blue-50/10 cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/20">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              Click to select your submission file
                            </span>
                            <span className="text-xs text-gray-400 mt-1">PDFs, Images, or Zip files</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, "entryUrl")}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter className="sm:justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setOpenDialog(null)}
                      className="rounded-full font-bold h-12 px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (row.original.event.subcategory === "ONSITE_PAGEANT") {
                          if (!selectedMalePhotoFile || !selectedFemalePhotoFile) {
                            toast.error("Please select both photo files");
                            return;
                          }
                        } else {
                          if (!selectedFile) {
                            toast.error("Please select a submission file");
                            return;
                          }
                        }
                        setConfirmSubmitId(row.original.id);
                      }}
                      disabled={isSubmitting === row.original.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 px-10 font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                      Submit Entry
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {hasSubmitted && (
               <div className="flex items-center gap-1">
                 {isPageant ? (
                   (() => {
                     try {
                       const parsed = JSON.parse(row.original.entryUrl!);
                       return (
                         <>
                           <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8 hover:bg-blue-50 hover:text-blue-600" title="Male Photo">
                             <a href={parsed.malePhoto} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="sr-only">Male Photo</span>
                             </a>
                           </Button>
                           <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8 hover:bg-blue-50 hover:text-blue-600" title="Female Photo">
                             <a href={parsed.femalePhoto} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="sr-only">Female Photo</span>
                             </a>
                           </Button>
                         </>
                       );
                     } catch {
                       return null;
                     }
                   })()
                 ) : (
                   <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                     <a href={row.original.entryUrl!} target="_blank" rel="noopener noreferrer" title="View Entry">
                        <ExternalLink className="h-4 w-4" />
                     </a>
                   </Button>
                 )}
               </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const isApproved = row.original.status === "APPROVED";
        
        return (
          <div className="flex items-center justify-center">
            {isApproved ? (
              <Button variant="ghost" size="sm" disabled className="rounded-xl font-bold h-9 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed">
                <Pencil className="h-4 w-4 mr-2" /> Edit Info
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold h-9 hover:bg-gray-100">
                <Link href={`/registrations/edit/${row.original.id}`}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Info
                </Link>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      sorting,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[200px] rounded-xl border-2 font-bold focus:ring-0 shadow-none">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">To Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-[800px] lg:min-w-full">
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
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                     <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400">
                           <Globe className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No registrations found.</p>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmSubmitId !== null} onOpenChange={(open) => !open && setConfirmSubmitId(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-gray-900 transition-all duration-300">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" /> Confirm Submission
            </DialogTitle>
            <DialogDescription asChild className="font-medium text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
              <div>
                <p>Are you sure you want to submit your entry?</p>
                <div className="mt-4 p-4 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-100">
                      Important Notice
                    </p>
                    <p className="text-[11px] sm:text-xs font-medium leading-normal text-justify">
                      Submission is allowed only once. No further edits or modifications can be made after submission. For multi-file submission, archive the files through zip format. For submissions with more than 1GB of file size, upload the file to google drive, make sure that permissions are set to EVERYONE. Put the shareable link to a .txt file and upload.
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmSubmitId(null)}
              className="rounded-full font-bold h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const regId = confirmSubmitId;
                if (!regId) return;
                const reg = registrations.find(r => r.id === regId);
                if (!reg) return;
                setConfirmSubmitId(null);
                await handleSubmitEntry(regId, reg.event.subcategory);
              }}
              disabled={isSubmitting !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 px-8 font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
