"use client";

import { User, School } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface ParticipantsTableProps {
  participants: User[];
  totalPages: number;
  currentPage: number;
  schools: School[];
}

export default function ParticipantsTable({
  participants,
  totalPages,
  currentPage,
  schools,
}: ParticipantsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/admin/participants?${params.toString()}`);
  };

  const getFullSchoolName = (schoolAbbr: string | null) => {
    if (!schoolAbbr) return "N/A";
    const school = schools.find((s) => s.abbreviation === schoolAbbr || s.name === schoolAbbr);
    return school ? school.name : schoolAbbr;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <TableHead className="font-bold text-gray-900 dark:text-gray-100">Name</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100">Email</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100">School</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100">Course</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100">Role</TableHead>
              <TableHead className="font-bold text-gray-900 dark:text-gray-100">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500 dark:text-gray-400">
                  No participants found.
                </TableCell>
              </TableRow>
            ) : (
              participants.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800 text-sm">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{user.name || "N/A"}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{user.email}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{getFullSchoolName(user.school)}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{user.course || "N/A"}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{user.role}</TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="dark:border-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="dark:border-gray-700 dark:text-gray-300"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
