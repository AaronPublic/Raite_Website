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
  X
} from "lucide-react";
import { getRegistrationDetails } from "@/app/actions/reports";
import EntryUrlEditor from "@/components/registration/EntryUrlEditor";
import { RegistrationStatus, EventSubcategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  onToggleVerified,
  isUpdating
}: { 
  registration: Registration;
  onStatusUpdate: (id: string, status: RegistrationStatus, comment?: string) => Promise<void>;
  onToggleVerified: (id: string) => Promise<void>;
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
    ? Object.entries(requirements).filter(([key]) => key !== 'participants' && key !== 'members')
    : [];

  const loading = isUpdating === registration.id;
  const isOnline = registration.event.subcategory === "ONLINE";

  return (
    <Dialog onOpenChange={(open) => {
      if (open) {
        fetchDetails();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs">
          <Eye className="h-3.5 w-3.5" /> View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-black">Registration Details</DialogTitle>
          <div className="flex items-center gap-2 pr-8">
            {registration.status !== "APPROVED" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold gap-2"
                onClick={() => onStatusUpdate(registration.id, "APPROVED")}
                disabled={!!isUpdating}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl font-bold gap-2",
                registration.requirementsVerified ? "border-green-200 text-green-600" : "border-gray-200"
              )}
              onClick={() => onToggleVerified(registration.id)}
              disabled={!!isUpdating}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              {registration.requirementsVerified ? "Verified" : "Mark Verified"}
            </Button>
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading details...</p>
          </div>
        ) : (
          <div className="space-y-8 mt-4">
            {registration.adminComment && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-600">Admin Comment / Reason</p>
                  <p className="text-sm font-medium text-amber-900">{registration.adminComment}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500">School / Institution</p>
                <p className="font-bold text-lg">{registration.user.school || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500">Coach / Registered By</p>
                <p className="font-bold text-lg">{details?.coach?.name || registration.user.name}</p>
                <p className="text-xs text-gray-500">{details?.coach?.email || registration.user.email}</p>
              </div>
            </div>

            {isOnline && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-[10px] font-black uppercase text-blue-600 mb-4">Submission Link (Online Competition)</p>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <EntryUrlEditor registrationId={registration.id} initialEntryUrl={registration.entryUrl} />
                </div>
                <p className="text-[10px] text-blue-900/60 dark:text-blue-300/60 font-medium mt-2">Admins and assigned Sub-Admins can edit this link if the coach provided a wrong one.</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4">Registered Participants</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Unique ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details?.memberDetails?.length > 0 ? (
                      details.memberDetails.map((m: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold">{m.name}</TableCell>
                          <TableCell className="text-gray-500">{m.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">{m.id}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">No participants found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4">Uploaded Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documentEntries.length > 0 ? (
                  documentEntries.map(([name, url]: any, i: number) => (
                    <a key={i} href={url} target="_blank" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-all">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight truncate">{name.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Click to view document</span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl text-center w-full col-span-2">No documents uploaded.</p>
                )}
              </div>
            </div>
          </div>
        )}
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

  const handleToggleVerified = async (id: string) => {
    setIsUpdating(id);
    const result = await toggleRequirementsVerified(id);
    if (result.success) {
      toast.success("Verification status updated");
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
      accessorKey: "requirementsVerified",
      header: "Verified",
      cell: ({ row }) => (
        <button 
          onClick={() => handleToggleVerified(row.original.id)}
          disabled={isUpdating === row.original.id}
          className="hover:opacity-80 transition-opacity"
        >
          <Badge 
            variant={row.original.requirementsVerified ? "default" : "secondary"}
            className={cn(
              "cursor-pointer",
              row.original.requirementsVerified ? "bg-green-600" : ""
            )}
          >
            {isUpdating === row.original.id ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            {row.original.requirementsVerified ? "Yes" : "No"}
          </Badge>
        </button>
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
              status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" : 
              status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" : 
              status === "PENDING" ? "bg-blue-50 text-blue-700 border-blue-100" : 
              "bg-gray-50 text-gray-700 border-gray-100"
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
          onToggleVerified={handleToggleVerified}
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
      <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50/50 border-b-2 border-gray-100 hover:bg-transparent">
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
                <TableRow key={row.id} className="h-20 hover:bg-gray-50/50 transition-all border-b border-gray-100">
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
