"use client";

import { User, School } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Loader2, ChevronLeft, ChevronRight, FileText, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleUserApproval } from "@/app/actions/participants";
import { cn } from "@/lib/utils";
import Image from "next/image";

function ApprovalCell({ userId, initialApproved }: { userId: string; initialApproved: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [approved, setApproved] = useState(initialApproved);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const res = await toggleUserApproval(userId);
        if (res.success) {
          setApproved(res.approved);
          toast.success("User approval status updated.");
        } else {
          toast.error("Failed to update user approval.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update user approval.");
      }
    });
  };

  return (
    <Button
      variant={approved ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "rounded-xl font-bold h-9 px-3 transition-all text-xs",
        approved
          ? "bg-green-600 hover:bg-green-700 text-white border-none shadow-md shadow-green-600/20"
          : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-950/20"
      )}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : approved ? (
        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approved</span>
      ) : (
        <span className="flex items-center gap-1"><X className="w-3.5 h-3.5" /> Unapproved</span>
      )}
    </Button>
  );
}

function CertificateModal({ url, coachName }: { url: string; coachName: string | null }) {
  const [open, setOpen] = useState(false);
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdf = /\.pdf(\?.*)?$/i.test(url);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-xl font-bold h-9 px-3 text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all gap-1.5"
      >
        <FileText className="w-3.5 h-3.5" />
        View
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-0 overflow-hidden shadow-2xl flex flex-col"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  Membership Certificate
                </DialogTitle>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[200px] sm:max-w-xs">
                  {coachName || "Faculty Coach"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-black rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open</span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isImage ? (
              <div className="relative w-full min-h-[300px] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <Image
                  src={url}
                  alt={`Membership certificate of ${coachName || "Faculty Coach"}`}
                  width={800}
                  height={1100}
                  className="w-full h-auto object-contain"
                  unoptimized
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={url}
                className="w-full min-h-[500px] rounded-xl border border-gray-100 dark:border-gray-800"
                title={`Certificate of ${coachName || "Faculty Coach"}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-xs">
                  This certificate format cannot be previewed directly. Click <strong>Open</strong> or <strong>Download</strong> to view the file.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 h-11 text-sm font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Certificate
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ParticipantsTableProps {
  participants: User[];
  totalPages: number;
  currentPage: number;
  schools: School[];
}

export default function ParticipantsTable({
  participants,
  totalPages,
  currentPage,
  schools,
}: ParticipantsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const getFullSchoolName = (schoolAbbr: string | null) => {
    if (!schoolAbbr) return "N/A";
    const school = schools.find((s) => s.abbreviation === schoolAbbr || s.name === schoolAbbr);
    return school ? school.name : schoolAbbr;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-[900px] lg:min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 border-b-2 border-gray-100 dark:border-gray-800 hover:bg-transparent">
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Name</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Email</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">School</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Course</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Role</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Certificate</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Approved</TableHead>
                <TableHead className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((user) => (
                  <TableRow key={user.id} className="h-20 transition-all border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 group">
                    <TableCell className="px-6 font-bold text-gray-900 dark:text-white">{user.name || "N/A"}</TableCell>
                    <TableCell className="px-6 text-sm font-medium text-gray-500">{user.email}</TableCell>
                    <TableCell className="px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{getFullSchoolName(user.school)}</TableCell>
                    <TableCell className="px-6 text-sm font-medium text-gray-600 dark:text-gray-400">{user.course || "N/A"}</TableCell>
                    <TableCell className="px-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      {user.role === "FACULTY_COACH" && (user as any).coachCertificateUrl ? (
                        <CertificateModal
                          url={(user as any).coachCertificateUrl}
                          coachName={user.name}
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6">
                      <ApprovalCell userId={user.id} initialApproved={(user as any).approved} />
                    </TableCell>
                    <TableCell className="px-6 text-xs font-bold text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-xl border-2 font-bold px-4 h-10 dark:bg-gray-900 dark:border-gray-800"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-xl border-2 font-bold px-4 h-10 dark:bg-gray-900 dark:border-gray-800"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
