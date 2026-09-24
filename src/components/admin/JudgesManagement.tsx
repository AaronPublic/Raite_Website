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
import { 
  Plus, 
  Search, 
  Gavel, 
  Trash2, 
  Edit, 
  Loader2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  User,
  Lock
} from "lucide-react";
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
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; username?: string; password?: string }>({});

  // Edit Judge Modal State
  const [editingJudge, setEditingJudge] = useState<JudgeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSelectedEvents, setEditSelectedEvents] = useState<string[]>([]);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const handleOpenCreateModal = () => {
    setCreateName("");
    setCreateUsername("");
    setCreatePassword("");
    setCreateSelectedEvents([]);
    setCreateError(null);
    setFieldErrors({});
    setIsCreateOpen(true);
  };

  const handleCreateJudge = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const errors: { name?: string; username?: string; password?: string } = {};

    if (!createName.trim()) {
      errors.name = "Judge name is required";
    }
    if (!createUsername.trim()) {
      errors.username = "Username is required";
    }
    if (!createPassword.trim()) {
      errors.password = "Password is required";
    } else if (createPassword.trim().length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setCreateError("Please fix the highlighted fields below.");
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const res = await createJudge({
        name: createName.trim(),
        username: createUsername.trim(),
        password: createPassword.trim(),
        eventIds: createSelectedEvents,
      });

      if (res.success) {
        toast.success(`Judge account created for "${createUsername.trim()}"!`);
        setIsCreateOpen(false);
        // Reset form
        setCreateName("");
        setCreateUsername("");
        setCreatePassword("");
        setCreateSelectedEvents([]);
        setCreateError(null);

        // Update local state
        const cleanUser = createUsername.trim().toLowerCase();
        const newJudge: JudgeItem = {
          id: `temp-${Date.now()}`,
          name: createName.trim(),
          username: cleanUser,
          email: `${cleanUser}@raite2026.com`,
          clerkId: "new",
          assignedEvents: availableEvents.filter((ev) => createSelectedEvents.includes(ev.id)),
          evaluatedCount: 0,
          createdAt: new Date(),
        };
        setJudges((prev) => [newJudge, ...prev]);
      } else {
        const errorMsg = res.error || "Failed to create judge";
        setCreateError(errorMsg);
        
        // Highlight specific field if identifiable
        const lowerErr = errorMsg.toLowerCase();
        if (lowerErr.includes("username") || lowerErr.includes("email")) {
          setFieldErrors((prev) => ({ ...prev, username: errorMsg }));
        } else if (lowerErr.includes("password")) {
          setFieldErrors((prev) => ({ ...prev, password: errorMsg }));
        } else if (lowerErr.includes("name")) {
          setFieldErrors((prev) => ({ ...prev, name: errorMsg }));
        }
        
        toast.error(errorMsg);
      }
    });
  };

  const openEditModal = (judge: JudgeItem) => {
    setEditingJudge(judge);
    setEditName(judge.name);
    setEditPassword("");
    setEditSelectedEvents(judge.assignedEvents.map((e) => e.id));
    setShowEditPassword(false);
    setEditError(null);
  };

  const handleUpdateJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJudge) return;

    if (!editName.trim()) {
      setEditError("Judge name cannot be empty.");
      return;
    }
    if (editPassword && editPassword.trim().length < 6) {
      setEditError("New password must be at least 6 characters.");
      return;
    }

    setEditError(null);

    startTransition(async () => {
      const res = await updateJudge({
        judgeId: editingJudge.id,
        name: editName.trim(),
        password: editPassword.trim() || undefined,
        eventIds: editSelectedEvents,
      });

      if (res.success) {
        toast.success("Judge details updated successfully!");
        setJudges((prev) =>
          prev.map((j) =>
            j.id === editingJudge.id
              ? {
                  ...j,
                  name: editName.trim(),
                  assignedEvents: availableEvents.filter((ev) => editSelectedEvents.includes(ev.id)),
                }
              : j
          )
        );
        setEditingJudge(null);
      } else {
        const errMsg = res.error || "Failed to update judge";
        setEditError(errMsg);
        toast.error(errMsg);
      }
    });
  };

  const handleDeleteJudge = (judgeId: string, judgeName: string) => {
    startTransition(async () => {
      const res = await deleteJudge(judgeId);
      if (res.success) {
        toast.success(`Judge "${judgeName}" deleted.`);
        setJudges((prev) => prev.filter((j) => j.id !== judgeId));
        setDeletingJudge(null);
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-border/80 text-sm font-medium"
          />
        </div>

        {/* Add Judge Dialog Trigger */}
        <Button 
          onClick={handleOpenCreateModal}
          className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 h-10 px-5 text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add New Judge
        </Button>

        {/* Add Judge Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-2xl">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground uppercase tracking-tight">
                <Gavel className="w-5 h-5 text-primary" /> Create Judge Account
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground">
                Create credentials for a competition evaluator. The judge will log in directly using this username and password.
              </DialogDescription>
            </DialogHeader>

            {/* Error Banner */}
            {createError && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black uppercase tracking-wider text-[10px]">Please correct the following:</p>
                  <p className="leading-relaxed">{createError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateJudge} className="space-y-4 pt-1">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>Judge Full Name</span>
                  {fieldErrors.name && (
                    <span className="text-destructive font-bold text-[10px] normal-case">{fieldErrors.name}</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Dr. Maria Santos, Judge Alex"
                    value={createName}
                    onChange={(e) => {
                      setCreateName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                    }}
                    className={`rounded-xl h-11 bg-background text-sm font-medium ${
                      fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : "border-border/80"
                    }`}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>Username (Login ID)</span>
                  {fieldErrors.username && (
                    <span className="text-destructive font-bold text-[10px] normal-case">{fieldErrors.username}</span>
                  )}
                </Label>
                <Input
                  placeholder="e.g. judge1, judge_lanyard, maria_santos"
                  value={createUsername}
                  onChange={(e) => {
                    setCreateUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                  }}
                  className={`rounded-xl h-11 bg-background text-sm font-mono ${
                    fieldErrors.username ? "border-destructive focus-visible:ring-destructive" : "border-border/80"
                  }`}
                />
                <p className="text-[11px] text-muted-foreground">
                  The judge uses this username to log in. No email verification is required.
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>Password</span>
                  {fieldErrors.password && (
                    <span className="text-destructive font-bold text-[10px] normal-case">{fieldErrors.password}</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Enter password (min. 6-8 chars)"
                    value={createPassword}
                    onChange={(e) => {
                      setCreatePassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    className={`rounded-xl h-11 bg-background text-sm pr-10 ${
                      fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : "border-border/80"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Assign Competitions (Optional) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                    Assign Competitions
                  </Label>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    ({createSelectedEvents.length} selected)
                  </span>
                </div>
                <div className="space-y-2 bg-secondary/30 p-3.5 rounded-2xl border border-border/60 max-h-40 overflow-y-auto">
                  {availableEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No online competitions available</p>
                  ) : (
                    availableEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`create-${ev.id}`}
                          checked={createSelectedEvents.includes(ev.id)}
                          onCheckedChange={() => toggleCreateEvent(ev.id)}
                        />
                        <label
                          htmlFor={`create-${ev.id}`}
                          className="text-xs font-semibold text-foreground cursor-pointer select-none"
                        >
                          {ev.title}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl font-bold h-11 text-xs uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl font-black h-11 px-6 bg-primary hover:bg-primary/90 text-white text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Judge Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Judges Table */}
      <Card className="rounded-[2rem] border-border/80 shadow-xl overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" /> Active Judges ({judges.length})
              </CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">
                Judges can log in with their username and evaluate assigned submissions using the official rubric.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/40 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6">
                  Judge Name
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6">
                  Username (Login)
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6">
                  Assigned Competitions
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 text-center">
                  Evaluations Done
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJudges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium text-sm">
                    No judges found. Click &quot;Add New Judge&quot; above to create a judge account.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJudges.map((judge) => {
                  const displayUsername = judge.username || judge.email.replace("@raite2026.com", "").replace("@judge.raite.internal", "");

                  return (
                    <TableRow key={judge.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      {/* Judge Name */}
                      <TableCell className="font-bold text-sm text-foreground py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                            {judge.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{judge.name}</span>
                        </div>
                      </TableCell>

                      {/* Username */}
                      <TableCell className="text-xs font-mono font-bold text-foreground py-4 px-6">
                        <Badge variant="outline" className="bg-secondary/60 text-foreground border-border/80 font-mono text-xs px-2.5 py-1">
                          {displayUsername}
                        </Badge>
                      </TableCell>

                      {/* Assigned Competitions */}
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {judge.assignedEvents.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">No events assigned yet</span>
                          ) : (
                            judge.assignedEvents.map((ev) => (
                              <Badge
                                key={ev.id}
                                variant="secondary"
                                className="font-bold text-[10px] bg-primary/10 text-primary border-primary/20"
                              >
                                {ev.title}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>

                      {/* Evaluations Done */}
                      <TableCell className="text-center py-4 px-6">
                        <Badge variant="outline" className="font-black text-xs border-border/80">
                          {judge.evaluatedCount} evaluated
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(judge)}
                            className="h-8 w-8 p-0 rounded-lg text-primary hover:bg-primary/10 border-border/80"
                            title="Edit assignments & password"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingJudge(judge)}
                            className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10 border-border/80"
                            title="Delete Judge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Judge Dialog */}
      <Dialog open={!!editingJudge} onOpenChange={(open) => !open && setEditingJudge(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground uppercase tracking-tight">
              <KeyRound className="w-5 h-5 text-primary" /> Edit Judge Details
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Update name, assigned competitions, or reset password for judge &quot;{editingJudge?.username || editingJudge?.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateJudge} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl h-11 bg-background border-border/80 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                Reset Password <span className="text-muted-foreground font-normal lowercase">(leave blank to keep current)</span>
              </Label>
              <div className="relative">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  placeholder="New password (min. 6-8 chars)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="rounded-xl h-11 bg-background border-border/80 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                  Assign Competitions
                </Label>
                <span className="text-[10px] font-bold text-muted-foreground">
                  ({editSelectedEvents.length} selected)
                </span>
              </div>
              <div className="space-y-2 bg-secondary/30 p-3.5 rounded-2xl border border-border/60 max-h-40 overflow-y-auto">
                {availableEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`edit-${ev.id}`}
                      checked={editSelectedEvents.includes(ev.id)}
                      onCheckedChange={() => toggleEditEvent(ev.id)}
                    />
                    <label
                      htmlFor={`edit-${ev.id}`}
                      className="text-xs font-semibold text-foreground cursor-pointer select-none"
                    >
                      {ev.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingJudge(null)}
                className="rounded-xl font-bold h-11 text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl font-black h-11 px-6 bg-primary hover:bg-primary/90 text-white text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Judge Confirmation Dialog */}
      <Dialog open={!!deletingJudge} onOpenChange={(open) => !open && setDeletingJudge(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border border-border/80 shadow-2xl">
          <DialogHeader className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black uppercase text-foreground">
              Delete Judge Account
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Are you sure you want to delete judge &quot;{deletingJudge?.name}&quot; (@{deletingJudge?.username || deletingJudge?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingJudge(null)}
              disabled={isPending}
              className="rounded-xl font-bold h-11 text-xs uppercase tracking-wider flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingJudge && handleDeleteJudge(deletingJudge.id, deletingJudge.name)}
              disabled={isPending}
              className="rounded-xl font-black h-11 px-6 text-xs uppercase tracking-wider flex-1"
            >
              {isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
