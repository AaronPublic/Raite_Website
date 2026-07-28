"use client";

import { useState } from "react";
import { addSchool, deleteSchool, updateSchoolCategory } from "@/app/actions/admin";
import { School } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SchoolManagement({ schools }: { schools: School[] }) {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [category, setCategory] = useState<"MEMBER" | "NON_MEMBER">("MEMBER");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSchool = async () => {
    if (!name || !abbreviation) return;
    setIsLoading(true);
    const result = await addSchool({ name, abbreviation, category });
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setName("");
      setAbbreviation("");
      setCategory("MEMBER");
      toast.success("School added successfully");
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const result = await deleteSchool(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("School deleted successfully");
    }
  };

  const handleCategoryChange = async (id: string, newCategory: "MEMBER" | "NON_MEMBER") => {
    const loadingToast = toast.loading("Updating school category...");
    const result = await updateSchoolCategory(id, newCategory);
    toast.dismiss(loadingToast);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("School category updated successfully");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Schools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>School Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="University Name" />
          </div>
          <div className="space-y-2">
            <Label>Abbreviation</Label>
            <Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="UNI" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => { if (val) setCategory(val as any); }}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <SelectValue>
                  {category === "NON_MEMBER" ? "NON-MEMBER" : "MEMBER"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <SelectItem value="MEMBER">MEMBER</SelectItem>
                <SelectItem value="NON_MEMBER">NON-MEMBER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={handleAddSchool} disabled={isLoading} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add School
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Abbreviation</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id} className="border-b">
                  <td className="p-2">{school.name}</td>
                  <td className="p-2">{school.abbreviation}</td>
                  <td className="p-2">
                    <Select
                      value={school.category}
                      onValueChange={(val) => { if (val) handleCategoryChange(school.id, val as any); }}
                    >
                      <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <SelectValue>
                          {school.category === "NON_MEMBER" ? "NON-MEMBER" : "MEMBER"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <SelectItem value="MEMBER">MEMBER</SelectItem>
                        <SelectItem value="NON_MEMBER">NON-MEMBER</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
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
