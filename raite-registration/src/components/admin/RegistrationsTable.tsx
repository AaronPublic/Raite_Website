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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileSearch, 
  MessageSquare,
  ExternalLink,
  Loader2
} from "lucide-react";
import { updateRegistrationStatus, batchUpdateRegistrationStatus, verifyRequirements } from "@/app/actions/registrations";
import { RegistrationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Registration {
  id: string;
  status: RegistrationStatus;
  teamName: string | null;
  requirements: any;
  requirementsVerified: boolean;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
}

import { motion, AnimatePresence } from "framer-motion";

export default function RegistrationsTable({ initialData }: { initialData: Registration[] }) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState({});
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

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

  const handleVerify = async (id: string, current: boolean) => {
    setIsUpdating(id);
    const result = await verifyRequirements(id, !current);
    if (result.success) {
      toast.success(current ? "Verification removed" : "Requirements verified");
      router.refresh();
    } else {
      toast.error(result.error || "Update failed");
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      accessorKey: "user.name",
      header: "Participant",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-white">{row.original.user.name || "N/A"}</span>
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">{row.original.user.email}</span>
        </div>
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
      accessorKey: "requirementsVerified",
      header: () => <div className="text-center">Verified</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.requirementsVerified ? (
            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-600" />
            </div>
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
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                {isUpdating === reg.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-gray-800">
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 px-2 py-1.5">Management Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleStatusUpdate(reg.id, "APPROVED")} className="rounded-xl focus:bg-green-50 dark:focus:bg-green-900/20 focus:text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" /> Approve Enrollment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(reg.id, "REJECTED")} className="rounded-xl focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600 text-red-600">
                <XCircle className="mr-2 h-4 w-4" /> Reject Request
              </DropdownMenuItem>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
              <DropdownMenuItem onClick={() => handleVerify(reg.id, reg.requirementsVerified)} className="rounded-xl">
                <FileSearch className="mr-2 h-4 w-4" /> 
                {reg.requirementsVerified ? "Remove Verification" : "Verify Documents"}
              </DropdownMenuItem>
              {reg.requirements?.studentId && (
                <DropdownMenuItem asChild className="rounded-xl">
                  <a href={reg.requirements.studentId} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Inspect Student ID
                  </a>
                </DropdownMenuItem>
              )}
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 dark:border-gray-200 backdrop-blur-xl min-w-[400px] justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black">
                {selectedCount}
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Records Selected</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Execute batch operations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold px-4 h-10"
                onClick={() => handleBatchUpdate("APPROVED")}
              >
                Approve All
              </Button>
              <Button 
                size="sm" 
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold px-4 h-10"
                onClick={() => handleBatchUpdate("REJECTED")}
              >
                Reject All
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
        <Table>
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
    </div>
  );
}
