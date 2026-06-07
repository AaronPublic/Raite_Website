"use client";

import { useState } from "react";
import { updateLeaderboard } from "@/app/actions/ranking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, School } from "lucide-react";
import { SCHOOLS } from "@/lib/constants";

export default function RankingForm({ initialEntries }: { initialEntries?: any[] }) {
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
    // Ensure we don't remove all entries for a place if possible, but actually we can since we'll filter them anyway
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Update Overall Podium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {[1, 2, 3].map(place => (
              <div key={place} className="space-y-4 p-6 bg-secondary/30 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      place === 1 ? "bg-highlight text-primary" : 
                      place === 2 ? "bg-muted text-foreground" : 
                      "bg-accent/20 text-accent"
                    }`}>
                      {place}
                    </div>
                    <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">
                      {place === 1 ? "Champion" : place === 2 ? "1st Runner Up" : "2nd Runner Up"}
                    </h3>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addTie(place)}
                    className="h-8 gap-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    <Plus className="w-3 h-3" /> Add Tie
                  </Button>
                </div>

                <div className="space-y-3">
                  {getEntriesForPlace(place).map((entry) => (
                    <div key={entry.originalIndex} className="flex gap-2">
                      <Select 
                        value={entry.university} 
                        onValueChange={(value) => handleUpdate(entry.originalIndex, value)}
                      >
                        <SelectTrigger className="bg-background">
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Select University" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOLS.map((school) => (
                            <SelectItem key={school} value={school}>
                              {school}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeEntry(entry.originalIndex)} 
                        className="text-destructive shrink-0 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {getEntriesForPlace(place).length === 0 && (
                    <p className="text-xs text-muted-foreground italic pl-11">No entries for this position.</p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto px-12">
                {isSubmitting ? "Saving..." : "Save Overall Rankings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}
