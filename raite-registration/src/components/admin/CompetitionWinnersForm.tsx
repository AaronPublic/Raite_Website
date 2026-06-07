"use client";

import { useState } from "react";
import { updateCompetitionWinners } from "@/app/actions/ranking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Trophy } from "lucide-react";

export default function CompetitionWinnersForm({ initialWinners }: { initialWinners?: any[] }) {
  const [winners, setWinners] = useState(
    initialWinners?.length ? initialWinners : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = () => {
    setWinners([...winners, { competitionName: "", champion: "", firstRunnerUp: "", secondRunnerUp: "" }]);
  };

  const removeRow = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newWinners = [...winners];
    newWinners[index] = { ...newWinners[index], [field]: value };
    setWinners(newWinners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out completely empty rows
    const winnersToSave = winners.filter(w => w.competitionName.trim() !== "");
    
    const result = await updateCompetitionWinners(winnersToSave);
    if (result.success) {
      toast.success("Competition winners updated!");
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Manage Competition Winners
        </CardTitle>
        <Button variant="secondary" size="sm" onClick={addRow} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Competition
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-xs">Competition Name</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-xs">Champion</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-xs">1st Runner Up</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-xs">2nd Runner Up</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <Input 
                        placeholder="e.g. Web Development" 
                        value={winner.competitionName}
                        onChange={(e) => handleChange(index, "competitionName", e.target.value)}
                        className="bg-background"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        placeholder="School Name" 
                        value={winner.champion}
                        onChange={(e) => handleChange(index, "champion", e.target.value)}
                        className="bg-background"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        placeholder="School Name" 
                        value={winner.firstRunnerUp}
                        onChange={(e) => handleChange(index, "firstRunnerUp", e.target.value)}
                        className="bg-background"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        placeholder="School Name" 
                        value={winner.secondRunnerUp}
                        onChange={(e) => handleChange(index, "secondRunnerUp", e.target.value)}
                        className="bg-background"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeRow(index)} 
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {winners.length === 0 && (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">No competition winners added yet.</p>
              <p className="text-sm">Click "Add Competition" to start documenting the champions.</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            {winners.length > 0 && (
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Saving..." : "Save All Winners"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
