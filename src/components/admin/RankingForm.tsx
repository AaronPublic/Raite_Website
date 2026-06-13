"use client";

import { useState } from "react";
import { updateLeaderboard } from "@/app/actions/ranking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, Plus, Trash2 } from "lucide-react";

export default function RankingForm({ 
  initialEntries, 
  schools 
}: { 
  initialEntries?: any[], 
  schools: any[] 
}) {
  const [entries, setEntries] = useState<{ place: number; university: string }[]>(
    initialEntries?.length 
      ? initialEntries.map(e => ({ place: e.place, university: e.university })) 
      : [
          { place: 1, university: "" },
          { place: 2, university: "" },
          { place: 3, university: "" },
        ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTie = (place: number) => {
    setEntries([...entries, { place, university: "" }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index].university = value;
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out completely empty entries
    const entriesToSave = entries.filter(e => e.university.trim() !== "");
    
    const result = await updateLeaderboard(entriesToSave);
    if (result.success) {
      toast.success("Leaderboard updated!");
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const getEntriesForPlace = (place: number) => {
    return entries
      .map((entry, originalIndex) => ({ ...entry, originalIndex }))
      .filter(entry => entry.place === place);
  };

  return (
      <Card className="w-full shadow-2xl shadow-blue-900/5 border-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Podium Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {[1, 2, 3].map(place => (
              <div key={place} className="space-y-4 p-5 bg-muted/30 dark:bg-secondary/20 rounded-[2rem] border border-border/40 transition-all hover:border-primary/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 ${
                      place === 1 ? "bg-accent text-accent-foreground" : 
                      place === 2 ? "bg-muted text-foreground border border-border" : 
                      "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}>
                      {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
                    </div>
                    <div>
                      <h3 className="font-black text-foreground uppercase tracking-wider text-xs leading-tight">
                        {place === 1 ? "Champion" : place === 2 ? "1st Runner Up" : "2nd Runner Up"}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">University Placement</p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => addTie(place)}
                    className="h-8 w-full sm:w-auto gap-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all border border-primary/10 sm:border-transparent"
                  >
                    <Plus className="w-3 h-3" /> Add Tie
                  </Button>
                </div>

                <div className="space-y-3">
                  {getEntriesForPlace(place).map((entry) => (
                    <div key={entry.originalIndex} className="flex gap-2 group">
                      <div className="flex-1">
                        <Select value={entry.university} onValueChange={(v) => handleUpdate(entry.originalIndex, v || "")}>
                          <SelectTrigger className="bg-card h-10 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20">
                            <SelectValue placeholder="Select University..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {schools.map((school) => (
                              <SelectItem key={school.name} value={school.name}>
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeEntry(entry.originalIndex)} 
                        className="text-muted-foreground shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {getEntriesForPlace(place).length === 0 && (
                    <p className="text-xs text-muted-foreground italic pl-2 py-2">No entries assigned.</p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full rounded-2xl font-black uppercase tracking-widest h-14 shadow-lg shadow-primary/20">
                {isSubmitting ? "Updating Rankings..." : "Save Overall Rankings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}
