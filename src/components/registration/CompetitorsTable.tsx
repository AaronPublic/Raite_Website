"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2, Search, Loader2 } from "lucide-react";
import { updateParticipant, deleteParticipant } from "@/app/actions/participants";
import { COURSES } from "@/lib/constants";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Participant {
  id: string;
  name: string | null;
  email: string;
  school: string | null;
  course: string | null;
  uniqueId: string | null;
  approved: boolean;
  role?: string | null;
  shirtSize?: string | null;
}

interface CompetitorsTableProps {
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

export function CompetitorsTable({ initialParticipants }: CompetitorsTableProps) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit State
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editShirtSize, setEditShirtSize] = useState("XL");
  const [isCustomCourseActive, setIsCustomCourseActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered participants
  const filteredParticipants = participants.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.course || "").toLowerCase().includes(term) ||
      (p.uniqueId || "").toLowerCase().includes(term)
    );
  });

  const handleEditClick = (p: Participant) => {
    setEditingParticipant(p);
    setEditName(p.name ?? "");
    setEditEmail(p.email ?? "");
    setEditCourse(p.course ?? "");
    setEditShirtSize(p.shirtSize ?? "XL");
    
    // Check if current course is custom
    const isCustom = p.course ? !COURSES.includes(p.course) : false;
    setIsCustomCourseActive(isCustom);
  };

  const handleShirtSizeChange = async (participantId: string, size: string) => {
    const p = participants.find((x) => x.id === participantId);
    if (!p) return;
    try {
      const result = await updateParticipant(participantId, {
        name: p.name || "",
        email: p.email,
        course: p.role === "FACULTY_COACH" ? undefined : (p.course || undefined),
        shirtSize: size,
      });
      if (result.success) {
        setParticipants(
          participants.map((x) =>
            x.id === participantId ? { ...x, shirtSize: size } : x
          )
        );
        toast.success("Shirt size updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update shirt size");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingParticipant) return;
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateParticipant(editingParticipant.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        course: editingParticipant.role === "FACULTY_COACH" ? undefined : (editCourse.trim() || undefined),
        shirtSize: editShirtSize,
      });

      if (result.success) {
        setParticipants(
          participants.map((p) =>
            p.id === editingParticipant.id
              ? {
                  ...p,
                  name: editName.trim(),
                  email: editEmail.trim(),
                  course: editingParticipant.role === "FACULTY_COACH" ? null : (editCourse.trim() || null),
                  shirtSize: editShirtSize,
                }
              : p
          )
        );
        toast.success("Details updated successfully");
        setEditingParticipant(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update competitor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingParticipant) return;
    setIsDeleting(true);
    try {
      const result = await deleteParticipant(deletingParticipant.id);
      if (result.success) {
        setParticipants(participants.filter((p) => p.id !== deletingParticipant.id));
        toast.success("Competitor deleted successfully");
        setDeletingParticipant(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete competitor");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, course, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        />
      </div>

      {/* Competitors List */}
      <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-xl overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14 pl-6">ID</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14">Name</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14">Email</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14">Course</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14">Shirt Size</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14 text-center">Status</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100 h-14 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 font-bold text-gray-400">
                  No competitors found.
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800">
                  <TableCell className="font-mono text-xs font-bold pl-6 text-gray-500 dark:text-gray-400">
                    {p.uniqueId || "N/A"}
                  </TableCell>
                  <TableCell className="font-bold text-gray-900 dark:text-white">
                    {p.name || "N/A"}
                    {p.role === "FACULTY_COACH" && (
                      <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 hover:bg-blue-50/80 font-black text-[9px] tracking-wider rounded-md border">
                        COACH
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-gray-600 dark:text-gray-400">{p.email}</TableCell>
                  <TableCell className="font-medium text-gray-600 dark:text-gray-400">
                    {p.role === "FACULTY_COACH" ? "N/A" : (p.course || "N/A")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={p.shirtSize || "XL"}
                      onValueChange={(val) => handleShirtSizeChange(p.id, val || "XL")}
                    >
                      <SelectTrigger className="h-9 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 font-medium px-3 text-xs w-[140px]">
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
                  <TableCell className="text-center">
                    {p.approved ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 hover:bg-green-50/80 font-black text-[10px] tracking-wider rounded-md border">
                        APPROVED
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 hover:bg-red-50/80 font-black text-[10px] tracking-wider rounded-md border">
                        UNAPPROVED
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6 space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(p)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-9 w-9 p-0 rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {p.role !== "FACULTY_COACH" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingParticipant(p)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 w-9 p-0 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingParticipant !== null} onOpenChange={(open) => !open && setEditingParticipant(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Edit Competitor
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Update name, email, and details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-gray-400">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              />
            </div>
            {editingParticipant?.role !== "FACULTY_COACH" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Course</Label>
                <Select
                  value={isCustomCourseActive ? "Others" : editCourse}
                  onValueChange={(val) => {
                    if (val === "Others") {
                      setIsCustomCourseActive(true);
                      if (COURSES.includes(editCourse)) {
                        setEditCourse("");
                      }
                    } else {
                      setIsCustomCourseActive(false);
                      setEditCourse(val ?? "");
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 font-medium px-4">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 max-h-[250px]">
                    {COURSES.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>

                {isCustomCourseActive && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                    <Input
                      placeholder="Type custom course name"
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Shirt Size</Label>
              <Select
                value={editShirtSize}
                onValueChange={(val) => setEditShirtSize(val || "XL")}
              >
                <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-600/20 font-medium px-4">
                  <SelectValue placeholder="Select shirt size" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                  {SHIRT_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingParticipant(null)}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-800 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deletingParticipant !== null} onOpenChange={(open) => !open && setDeletingParticipant(null)}>
        <DialogContent className="sm:max-w-[440px] rounded-[2rem] border-none shadow-2xl p-8 bg-white dark:bg-gray-900">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Delete Competitor
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">
                Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{deletingParticipant?.name}</span>? This action is permanent and will also delete all of their competition registrations.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="pt-6 flex gap-2 w-full justify-center sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeletingParticipant(null)}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-800 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
