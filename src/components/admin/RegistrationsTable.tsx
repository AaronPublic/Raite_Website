"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Trash2, 
  Eye, 
  Pencil,
  AlertCircle,
  Check
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateRegistrationStatus, batchUpdateRegistrationStatus, deleteRegistration } from "@/app/actions/registrations";
import { RegistrationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ExportButtons from "./ExportButtons";

interface Registration {
  id: string;
  status: RegistrationStatus;
  teamName: string | null;
  requirements: any;
  requirementsVerified: boolean;
  createdAt: string;
  registeredBy: string | null;
  coach: {
    name: string | null;
    email: string;
  } | null;
  user: {
    name: string | null;
    email: string;
    school: string | null;
  };
  event: {
    id: string;
    title: string;
  };
}

export default function RegistrationsTable({ initialData }: { initialData: Registration[] }) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState({});
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [reviewRegId, setReviewRegId] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");
  const [isBatchReviewOpen, setIsBatchReviewOpen] = React.useState(false);
  const [batchComment, setBatchComment] = React.useState("");
  const [deleteRegId, setDeleteRegId] = React.useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: RegistrationStatus) => {
    setIsUpdating(id);
    const result = await updateRegistrationStatus({ id, status });
    if (result.success) {
      toast.success(`Registration ${status.toLowerCase()}`);
      router.refresh();
    } else {
      toast.error(result.error || "Update failed");
    }
    setIsUpdating(null);
  };

  const handleDelete = async (id: string) => {
    setIsUpdating(id);
    const result = await deleteRegistration(id);
    if (result.success) {
      toast.success("Registration deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setIsUpdating(null);
  };

  const handleBatchUpdate = async (status: RegistrationStatus) => {
    const ids = table.getSelectedRowModel().rows.map(row => (row.original as Registration).id);
    if (ids.length === 0) return;

    const result = await batchUpdateRegistrationStatus({ ids, status });
    if (result.success) {
      toast.success(`Updated ${ids.length} registrations to ${status}`);
      setRowSelection({});
      router.refresh();
    } else {
      toast.error(result.error || "Batch update failed");
    }
  };

  const columns: ColumnDef<Registration>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={Boolean(table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected())}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-gray-300 dark:border-gray-700"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-gray-300 dark:border-gray-700"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
      accessorKey: "event.title",
      header: "Competition",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{row.original.event.title}</span>
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
              status === "REJECTED" ? "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-450 dark:border-yellow-900/30" : 
              status === "PENDING" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30" : 
              "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            )}
          >
            {status === "REJECTED" ? "TO REVIEW" : status}
          </Badge>
        );
      },
    },
    {
      id: "competitor",
      header: "Competitor / Team",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-white">
            {row.original.teamName || row.original.user.name || "N/A"}
          </span>
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
            {row.original.user.email}
          </span>
        </div>
      ),
    },
    {
      id: "coach",
      header: "Faculty Coach",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-white">
            {row.original.coach?.name || row.original.registeredBy || "N/A"}
          </span>
          {row.original.coach?.email && (
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
              {row.original.coach.email}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const reg = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                suppressHydrationWarning
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center"
              >
                {isUpdating === reg.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <MoreHorizontal className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-gray-800">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 px-2 py-1.5">Management Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/registrations/view/${reg.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/registrations/edit/${reg.id}`}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Registration
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                {reg.status !== "APPROVED" && (
                  <DropdownMenuItem onClick={() => handleStatusUpdate(reg.id, "APPROVED")} className="focus:bg-green-50 focus:text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                  </DropdownMenuItem>
                )}
                {reg.status !== "REJECTED" && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setTimeout(() => {
                        setReviewRegId(reg.id);
                        setComment("");
                      }, 100);
                    }} 
                    className="focus:bg-yellow-50 focus:text-yellow-600 text-yellow-600 dark:focus:bg-yellow-950/20"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" /> Flag for Review
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setTimeout(() => {
                      setDeleteRegId(reg.id);
                    }, 100);
                  }} 
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: initialData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="relative">
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 sm:px-6 py-3.5 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/10 dark:border-gray-200 backdrop-blur-xl w-[calc(100%-2rem)] sm:w-auto sm:min-w-[400px] justify-between"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0">
                {selectedCount}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-black tracking-tight">Records Selected</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Execute batch operations</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-center w-full sm:w-auto">
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold px-4 h-10"
                onClick={() => handleBatchUpdate("APPROVED")}
              >
                Approve All
              </Button>
              <Button 
                size="sm" 
                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold px-4 h-10 shadow-lg shadow-yellow-600/10"
                onClick={() => {
                  setBatchComment("");
                  setIsBatchReviewOpen(true);
                }}
              >
                Flag for Review
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setRowSelection({})}
                className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 h-10 w-10 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-[1000px] lg:min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50/50 dark:bg-gray-800/30 border-b-2 border-gray-100 dark:border-gray-800 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 px-6">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "h-20 transition-all border-b border-gray-100 dark:border-gray-800/50 group",
                      row.getIsSelected() ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                    )}
                  >
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
                    Zero data matching current criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 px-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl border-2 font-bold px-4 h-10 dark:bg-gray-900 dark:border-gray-800"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl border-2 font-bold px-4 h-10 dark:bg-gray-900 dark:border-gray-800"
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!reviewRegId} onOpenChange={(open) => { if (!open) setReviewRegId(null); }}>
        <DialogContent className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Flag for Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/50 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-750 dark:text-yellow-300 font-medium">
                Please specify what needs to be reviewed or corrected in this registration. This comment will be visible to the participant.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500">Review Comments</label>
              <Textarea 
                placeholder="e.g., Missing valid ID, Incorrect documentation, please re-upload..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-xl border-gray-200 min-h-[120px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewRegId(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={async () => {
                  if (!comment.trim()) {
                    toast.error("Please provide a reason for review request");
                    return;
                  }
                  if (reviewRegId) {
                    setIsUpdating(reviewRegId);
                    setReviewRegId(null);
                    const result = await updateRegistrationStatus({ id: reviewRegId, status: "REJECTED", comment });
                    if (result.success) {
                      toast.success("Registration sent for review");
                      router.refresh();
                    } else {
                      toast.error(result.error || "Update failed");
                    }
                    setIsUpdating(null);
                  }
                }} 
                disabled={!!isUpdating}
                className="rounded-xl font-bold gap-2 bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/10"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Send for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchReviewOpen} onOpenChange={setIsBatchReviewOpen}>
        <DialogContent className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Flag Selected for Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/50 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-750 dark:text-yellow-300 font-medium">
                Specify a comment/message to apply to all selected ({selectedCount}) registrations.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500">Review Comments</label>
              <Textarea 
                placeholder="e.g., Please check your uploaded requirements..."
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                className="rounded-xl border-gray-200 min-h-[120px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsBatchReviewOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={async () => {
                  if (!batchComment.trim()) {
                    toast.error("Please provide a reason for review request");
                    return;
                  }
                  const ids = table.getSelectedRowModel().rows.map(row => (row.original as Registration).id);
                  if (ids.length === 0) return;

                  setIsUpdating("batch");
                  setIsBatchReviewOpen(false);
                  const result = await batchUpdateRegistrationStatus({ 
                    ids, 
                    status: "REJECTED", 
                    comment: batchComment 
                  });
                  if (result.success) {
                    toast.success(`Flagged ${ids.length} registrations for review`);
                    setRowSelection({});
                    router.refresh();
                  } else {
                    toast.error(result.error || "Batch update failed");
                  }
                  setIsUpdating(null);
                }} 
                disabled={isUpdating === "batch"}
                className="rounded-xl font-bold gap-2 bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/10"
              >
                {isUpdating === "batch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Send for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRegId} onOpenChange={(open) => { if (!open) setDeleteRegId(null); }}>
        <DialogContent className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex gap-3">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm text-red-750 dark:text-red-300 font-medium">
                Are you sure you want to permanently delete this registration? This action is irreversible. All team details, submissions, and status records will be lost forever.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteRegId(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={async () => {
                  if (deleteRegId) {
                    const id = deleteRegId;
                    setDeleteRegId(null);
                    await handleDelete(id);
                  }
                }}
                disabled={isUpdating === deleteRegId}
                className="rounded-xl font-bold gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10"
              >
                {isUpdating === deleteRegId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
