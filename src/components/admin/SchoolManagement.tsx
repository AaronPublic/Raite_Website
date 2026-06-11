"use client";

import { useState } from "react";
import { addSchool, deleteSchool } from "@/app/actions/admin";
import { School } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"; // Assuming sonner is used for toasts, check if installed

export default function SchoolManagement({ schools }: { schools: School[] }) {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSchool = async () => {
    if (!name || !abbreviation) return;
    setIsLoading(true);
    const result = await addSchool({ name, abbreviation });
    setIsLoading(false);
    if (result.error) {
      alert(result.error);
    } else {
      setName("");
      setAbbreviation("");
      // toast.success("School added");
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await deleteSchool(id);
    // toast.success("School deleted");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Schools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>School Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="University Name" />
          </div>
          <div className="space-y-2">
            <Label>Abbreviation</Label>
            <Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="UNI" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddSchool} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" /> Add School
            </Button>
          </div>
        </div>

        <div className="border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Abbreviation</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id} className="border-b">
                  <td className="p-2">{school.name}</td>
                  <td className="p-2">{school.abbreviation}</td>
                  <td className="p-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSchool(school.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
