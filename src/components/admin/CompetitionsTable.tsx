"use client";

import { useState } from "react";
import { Event, EventStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { deleteCompetition, toggleRegistrationStatus } from "@/app/actions/competitions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CompetitionsTableProps {
  events: Event[];
}

export default function CompetitionsTable({ events }: CompetitionsTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competition? This will also delete all associated registrations.")) return;
    
    setIsDeleting(id);
    try {
      await deleteCompetition(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete competition:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: EventStatus) => {
    const isOpen = currentStatus === "UPCOMING";
    try {
      await toggleRegistrationStatus(id, !isOpen);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Title</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Category</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Status</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">Reg. Limit (Team Size)</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Start Date</TableHead>
            <TableHead className="text-right font-bold text-gray-900 dark:text-gray-100">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500 dark:text-gray-400">
                No competitions found.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800">
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{event.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    {event.category || "Uncategorized"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={event.status === "UPCOMING" ? "default" : "secondary"}>
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-gray-700 dark:text-gray-300">
                  {event.maxRegistrations || "∞"} ({event.maxParticipantsPerRegistration})
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(event.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <DropdownMenuItem>
                        <Link href={`/admin/competitions/${event.id}/edit`} className="flex items-center text-gray-900 dark:text-gray-100">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(event.id, event.status)} className="text-gray-900 dark:text-gray-100">
                        {event.status === "UPCOMING" ? (
                          <><PowerOff className="mr-2 h-4 w-4 text-orange-500" /> Close Reg</>
                        ) : (
                          <><Power className="mr-2 h-4 w-4 text-green-500" /> Open Reg</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400" 
                        onClick={() => handleDelete(event.id)}
                        disabled={isDeleting === event.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> 
                        {isDeleting === event.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
