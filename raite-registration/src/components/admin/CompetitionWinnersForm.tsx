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
    <Card className="w-full shadow-2xl shadow-blue-900/5 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Champions Registry
        </CardTitle>
        <Button variant="outline" size="sm" onClick={addRow} className="flex items-center gap-2 rounded-xl font-bold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
          <Plus className="w-4 h-4" /> Add Competition
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20 dark:bg-secondary/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted/50 dark:bg-secondary/30">
                    <th className="py-4 px-4 font-black text-muted-foreground uppercase text-[10px] tracking-widest">Competition Name</th>
                    <th className="py-4 px-4 font-black text-muted-foreground uppercase text-[10px] tracking-widest">Champion</th>
                    <th className="py-4 px-4 font-black text-muted-foreground uppercase text-[10px] tracking-widest">1st Runner Up</th>
                    <th className="py-4 px-4 font-black text-muted-foreground uppercase text-[10px] tracking-widest">2nd Runner Up</th>
                    <th className="py-4 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((winner, index) => (
                    <tr key={index} className="border-t border-border/40 hover:bg-card/50 transition-colors">
                      <td className="py-3 px-2">
                        <Input 
                          placeholder="e.g. Web Development" 
                          value={winner.competitionName}
                          onChange={(e) => handleChange(index, "competitionName", e.target.value)}
                          className="bg-transparent border-transparent focus:border-primary/30 h-10 rounded-xl"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input 
                          placeholder="School Name" 
                          value={winner.champion}
                          onChange={(e) => handleChange(index, "champion", e.target.value)}
                          className="bg-transparent border-transparent focus:border-primary/30 h-10 rounded-xl"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input 
                          placeholder="School Name" 
                          value={winner.firstRunnerUp}
                          onChange={(e) => handleChange(index, "firstRunnerUp", e.target.value)}
                          className="bg-transparent border-transparent focus:border-primary/30 h-10 rounded-xl"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input 
                          placeholder="School Name" 
                          value={winner.secondRunnerUp}
                          onChange={(e) => handleChange(index, "secondRunnerUp", e.target.value)}
                          className="bg-transparent border-transparent focus:border-primary/30 h-10 rounded-xl"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeRow(index)} 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {winners.length === 0 && (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border/50 rounded-[2rem] bg-muted/10">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest text-sm mb-1">No data recorded</p>
              <p className="text-xs">Click "Add Competition" to start documenting the winners.</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            {winners.length > 0 && (
              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto px-12 rounded-2xl font-black uppercase tracking-widest h-14 shadow-lg shadow-primary/20">
                {isSubmitting ? "Saving Registry..." : "Confirm & Save Results"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
