"use client";

import { useState } from "react";
import { updateLeaderboard } from "@/app/actions/ranking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export default function RankingForm({ initialEntries }: { initialEntries?: any[] }) {
  const [entries, setEntries] = useState(
    initialEntries?.length ? initialEntries : [
      { place: 1, name: "", university: "" },
      { place: 2, name: "", university: "" },
      { place: 3, name: "", university: "" },
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = (place: number, field: string, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.place === place ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateLeaderboard(entries);
    if (result.success) {
      toast.success("Leaderboard updated!");
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            Update Podium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {entries.map(entry => (
              <div key={entry.place} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="font-bold text-gray-500">Place {entry.place}</div>
                <Input 
                  placeholder="Team Name" 
                  value={entry.name}
                  onChange={(e) => handleUpdate(entry.place, "name", e.target.value)}
                />
                <Input 
                  placeholder="University" 
                  value={entry.university}
                  onChange={(e) => handleUpdate(entry.place, "university", e.target.value)}
                />
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Rankings"}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}
