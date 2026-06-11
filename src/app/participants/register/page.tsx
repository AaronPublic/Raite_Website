"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, FileUp, Loader2, Info, Trash2, Edit2, X, Check, Plus, Download } from "lucide-react";
import { bulkRegisterParticipants } from "@/app/actions/participants";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ParticipantRecord {
  firstName: string;
  lastName: string;
  middleInitial: string;
  email: string;
  course: string;
  id: string; // Internal ID for editing/deletion
}

export default function BulkRegisterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ParticipantRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ParticipantRecord>>({});
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please upload a valid CSV file.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Validation: Required columns as per prompt
        const requiredFields = ["First Name", "Last Name", "Middle Initial", "Email Address", "Course"];
        const headers = results.meta.fields || [];
        const missingFields = requiredFields.filter(f => !headers.includes(f));

        if (missingFields.length > 0) {
          setError(`CSV is missing required columns: ${missingFields.join(", ")}`);
          setRecords([]);
          return;
        }

        const formattedRecords: ParticipantRecord[] = data.map((p, index) => {
          return {
            firstName: (p["First Name"] || "").trim(),
            middleInitial: (p["Middle Initial"] || "").trim(),
            lastName: (p["Last Name"] || "").trim(),
            email: (p["Email Address"] || "").trim(),
            course: (p["Course"] || "").trim(),
            id: Math.random().toString(36).substr(2, 9),
          };
        });

        setRecords(formattedRecords);
        if (formattedRecords.length === 0) {
          setError("No participant data found in the CSV.");
        }
      },
      error: (err) => {
        setError("Failed to parse CSV file.");
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ["First Name", "Last Name", "Middle Initial", "Email Address", "Course"];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "raite_bulk_registration_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const startEditing = (record: ParticipantRecord) => {
    setEditingId(record.id);
    setEditValues(record);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    setRecords(records.map(r => r.id === editingId ? { ...r, ...editValues } as ParticipantRecord : r));
    setEditingId(null);
    setEditValues({});
  };

  const addNewRecord = () => {
    const newRecord: ParticipantRecord = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: "",
      lastName: "",
      middleInitial: "",
      email: "",
      course: "",
    };
    setRecords([newRecord, ...records]);
    setEditingId(newRecord.id);
    setEditValues(newRecord);
  };

  const handleUpload = async () => {
    if (records.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    // Capture any active edit before uploading
    const finalRecords = records.map(r => 
      r.id === editingId ? ({ ...r, ...editValues } as ParticipantRecord) : r
    );

    // Filter out invalid rows and map back to name field
    const validParticipants = finalRecords
      .map(({ firstName, lastName, middleInitial, ...rest }) => {
        const fullName = [firstName, middleInitial, lastName]
            .filter(part => part && part.length > 0)
            .join(" ");
        return { ...rest, name: fullName };
      })
      .filter(p => p.name && p.email && p.course);
    
    if (validParticipants.length === 0) {
      setError("No valid participant data to register. Please fill in all fields (name, email, course).");
      setIsUploading(false);
      return;
    }

    try {
      const result = await bulkRegisterParticipants(validParticipants);
      if (result.success) {
        setSuccess(result.count);
        toast.success(`Successfully registered ${result.count} participants!`);
        setFile(null);
        setRecords([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to register participants. Please try again.");
      toast.error("Registration failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-blue-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileUp className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Bulk Participant Registration</CardTitle>
          </div>
          <CardDescription className="text-blue-100 font-medium">
            Upload, preview, and edit participant records before final submission.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-300">CSV Instructions:</p>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                <li>Required Columns: <code className="bg-white/50 dark:bg-black/20 px-1 rounded">First Name</code>, <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Last Name</code>, <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Middle Initial</code>, <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Email Address</code>, <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Course</code></li>
                <li>You can edit records directly in the preview table below.</li>
                <li>Participants will inherit your school profile.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-upload" className="text-lg font-bold">Upload CSV File</Label>
              <Button
                variant="ghost"
                onClick={downloadTemplate}
                className="text-blue-600 font-bold h-auto p-0 flex items-center gap-1 hover:bg-transparent hover:underline"
              >
                <Download className="w-4 h-4" /> Download Template
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 relative group">
                <Input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/50 cursor-pointer hover:border-blue-400 transition-colors file:hidden text-center flex items-center justify-center pt-10"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                  <FileUp className="w-8 h-8 mb-2" />
                  <p className="font-bold">{file ? file.name : "Click or drag file to upload"}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={addNewRecord}
                className="h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:text-blue-600 flex flex-col gap-2 transition-all"
              >
                <Plus className="w-8 h-8" />
                <span className="font-bold">Manual Entry</span>
              </Button>
            </div>
          </div>

          {records.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Preview & Edit Records ({records.length})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addNewRecord} className="text-blue-600 font-bold border-blue-100 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRecords([])} className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold border-red-100">
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">First Name</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">M.I.</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">Last Name</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">Email</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">Course</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800">
                        {editingId === record.id ? (
                          <>
                            <TableCell><Input placeholder="First" value={editValues.firstName} onChange={e => setEditValues({...editValues, firstName: e.target.value})} className="h-8 rounded-lg" /></TableCell>
                            <TableCell><Input placeholder="M.I." value={editValues.middleInitial} onChange={e => setEditValues({...editValues, middleInitial: e.target.value})} className="h-8 rounded-lg w-16" /></TableCell>
                            <TableCell><Input placeholder="Last" value={editValues.lastName} onChange={e => setEditValues({...editValues, lastName: e.target.value})} className="h-8 rounded-lg" /></TableCell>
                            <TableCell><Input placeholder="Email" value={editValues.email} onChange={e => setEditValues({...editValues, email: e.target.value})} className="h-8 rounded-lg" /></TableCell>
                            <TableCell><Input placeholder="Course" value={editValues.course} onChange={e => setEditValues({...editValues, course: e.target.value})} className="h-8 rounded-lg" /></TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2 h-[57px]">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={saveEdit}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:bg-gray-100" onClick={cancelEditing}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{record.firstName}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{record.middleInitial}</TableCell>
                            <TableCell className="font-medium">{record.lastName}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{record.email}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{record.course}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => startEditing(record)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(record.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-800 font-bold animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl border border-green-100 dark:border-green-800 font-bold animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-5 h-5" />
              <p>Successfully registered {success} participants!</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleUpload} 
              disabled={records.length === 0 || isUploading}
              className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering...
                </>
              ) : (
                "Confirm & Register All"
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isUploading}
              className="h-14 px-8 rounded-2xl border-2 border-gray-200 dark:border-gray-800 text-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
