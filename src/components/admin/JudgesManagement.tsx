"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Gavel, Trash2, Edit, Loader2, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createJudge, deleteJudge, updateJudge } from "@/app/actions/admin-scoring";

interface JudgeItem {
  id: string;
  name: string;
  username?: string;
  email: string;
  clerkId: string | null;
  assignedEvents: { id: string; title: string }[];
  evaluatedCount: number;
  createdAt: Date;
}

interface EventItem {
  id: string;
  title: string;
  category: string | null;
}

interface JudgesManagementProps {
  initialJudges: JudgeItem[];
  availableEvents: EventItem[];
}

export default function JudgesManagement({ initialJudges, availableEvents }: JudgesManagementProps) {
  const [judges, setJudges] = useState<JudgeItem[]>(initialJudges);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Create Judge Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createSelectedEvents, setCreateSelectedEvents] = useState<string[]>([]);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit Judge Modal State
  const [editingJudge, setEditingJudge] = useState<JudgeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSelectedEvents, setEditSelectedEvents] = useState<string[]>([]);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete Judge Modal State
  const [deletingJudge, setDeletingJudge] = useState<JudgeItem | null>(null);

  // Filter judges
  const filteredJudges = judges.filter(
    (j) =>
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.username && j.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      j.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.assignedEvents.some((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createUsername || !createPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (createUsername.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }
    if (createPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (createSelectedEvents.length === 0) {
      toast.error("Please assign at least one competition to this judge.");
      return;
    }

    startTransition(async () => {
      const res = await createJudge({
        name: createName,
        username: createUsername,
        password: createPassword,
        eventIds: createSelectedEvents,
      });

      if (res.success) {
        toast.success(`Judge account created for "${createUsername}"!`);
        setIsCreateOpen(false);
        // Reset form
        setCreateName("");
        setCreateUsername("");
        setCreatePassword("");
        setCreateSelectedEvents([]);
        // Update local state
        const newJudge: JudgeItem = {
          id: `temp-${Date.now()}`,
          name: createName,
          username: createUsername.toLowerCase(),
          email: `${createUsername.toLowerCase()}@judge.raite.internal`,
          clerkId: "new",
          assignedEvents: availableEvents.filter((ev) => createSelectedEvents.includes(ev.id)),
          evaluatedCount: 0,
          createdAt: new Date(),
        };
        setJudges((prev) => [newJudge, ...prev]);
      } else {
        toast.error(res.error || "Failed to create judge");
      }
    });
  };

  const openEditModal = (judge: JudgeItem) => {
    setEditingJudge(judge);
    setEditName(judge.name);
    setEditPassword("");
    setEditSelectedEvents(judge.assignedEvents.map((e) => e.id));
    setShowEditPassword(false);
  };

  const handleUpdateJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJudge) return;

    if (!editName) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (editPassword && editPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (editSelectedEvents.length === 0) {
      toast.error("Please assign at least one competition to this judge.");
      return;
    }

    startTransition(async () => {
      const res = await updateJudge({
        judgeId: editingJudge.id,
        name: editName,
        password: editPassword || undefined,
        eventIds: editSelectedEvents,
      });

      if (res.success) {
        toast.success("Judge details updated successfully!");
        setJudges((prev) =>
          prev.map((j) =>
            j.id === editingJudge.id
              ? {
                  ...j,
                  name: editName,
                  assignedEvents: availableEvents.filter((ev) => editSelectedEvents.includes(ev.id)),
                }
              : j
          )
        );
        setEditingJudge(null);
      } else {
        toast.error(res.error || "Failed to update judge");
      }
    });
  };

  const handleDeleteJudge = (judgeId: string, judgeName: string) => {
    startTransition(async () => {
      const res = await deleteJudge(judgeId);
      if (res.success) {
        toast.success(`Judge "${judgeName}" deleted.`);
        setJudges((prev) => prev.filter((j) => j.id !== judgeId));
      } else {
        toast.error(res.error || "Failed to delete judge");
      }
    });
  };

  const toggleCreateEvent = (eventId: string) => {
    setCreateSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleEditEvent = (eventId: string) => {
    setEditSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, username, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-gray-200 dark:border-gray-800"
          />
        </div>

        {/* Add Judge Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 h-10 px-5">
              <Plus className="w-4 h-4" /> Add New Judge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-900 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" /> Create Judge Account
              </DialogTitle>
              <DialogDescription>
                Create credentials for a competition judge. The judge can log in with this username and password.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateJudge} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
                <Input
                  required
                  placeholder="e.g. Dr. Maria Santos"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Username</Label>
                <Input
                  required
                  placeholder="e.g. judge1, judge_lanyard"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Password</Label>
                <div className="relative">
                  <Input
                    required
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Assign Competitions</Label>
                <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 max-h-48 overflow-y-auto">
                  {availableEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`create-${ev.id}`}
                        checked={createSelectedEvents.includes(ev.id)}
                        onCheckedChange={() => toggleCreateEvent(ev.id)}
                      />
                      <label
                        htmlFor={`create-${ev.id}`}
                        className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                      >
                        {ev.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Judge"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Judges Table */}
      <Card className="rounded-[2rem] border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Active Judges ({judges.length})
          </CardTitle>
          <CardDescription>Judges can access assigned submissions and evaluate them via the Rubric.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold text-xs">Judge Name</TableHead>
                <TableHead className="font-bold text-xs">Username</TableHead>
                <TableHead className="font-bold text-xs">Assigned Competitions</TableHead>
                <TableHead className="font-bold text-xs text-center">Evaluations Done</TableHead>
                <TableHead className="font-bold text-xs text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJudges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium">
                    No judges found. Click &quot;Add New Judge&quot; to assign scoring evaluators.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJudges.map((judge) => (
                  <TableRow key={judge.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                          {judge.name.charAt(0).toUpperCase()}
                        </div>
                        {judge.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">
                      <span className="bg-secondary px-2.5 py-1 rounded-lg">
                        {judge.username || judge.email.replace("@judge.raite.internal", "")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {judge.assignedEvents.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No events assigned</span>
                        ) : (
                          judge.assignedEvents.map((ev) => (
                            <Badge
                              key={ev.id}
                              variant="secondary"
                              className="font-bold text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200"
                            >
                              {ev.title}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold text-xs">
                        {judge.evaluatedCount} evaluated
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(judge)}
                          className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Edit assignments & password"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingJudge(judge)}
                          className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete Judge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Judge Dialog */}
      <Dialog open={!!editingJudge} onOpenChange={(open) => !open && setEditingJudge(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-900 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Edit Judge Details
            </DialogTitle>
            <DialogDescription>
              Update name, assigned competitions, or reset the password for judge &quot;{editingJudge?.username || editingJudge?.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateJudge} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-500">
                Reset Password <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>
              </Label>
              <div className="relative">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  placeholder="New password (min. 8 chars)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold uppercase text-gray-500">Assign Competitions</Label>
              <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 max-h-48 overflow-y-auto">
                {availableEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`edit-${ev.id}`}
                      checked={editSelectedEvents.includes(ev.id)}
                      onCheckedChange={() => toggleEditEvent(ev.id)}
                    />
                    <label
                      htmlFor={`edit-${ev.id}`}
                      className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                    >
                      {ev.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingJudge(null)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingJudge} onOpenChange={(open) => !open && setDeletingJudge(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-gray-900 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Judge Account?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to delete judge &quot;{deletingJudge?.name}&quot; ({deletingJudge?.email})?
              This will remove their credentials and competition assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingJudge(null)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (deletingJudge) {
                  handleDeleteJudge(deletingJudge.id, deletingJudge.name);
                  setDeletingJudge(null);
                }
              }}
              className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Judge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
