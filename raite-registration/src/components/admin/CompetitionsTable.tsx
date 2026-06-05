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
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-bold">Title</TableHead>
            <TableHead className="font-bold">Category</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold text-center">Reg. Limit (Team Size)</TableHead>
            <TableHead className="font-bold">Start Date</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                No competitions found.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id} className="hover:bg-gray-50/30 transition-colors">
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {event.category || "Uncategorized"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={event.status === "UPCOMING" ? "default" : "secondary"}>
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {event.maxRegistrations || "∞"} ({event.maxParticipantsPerRegistration})
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(event.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/competitions/${event.id}/edit`} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(event.id, event.status)}>
                        {event.status === "UPCOMING" ? (
                          <><PowerOff className="mr-2 h-4 w-4 text-orange-500" /> Close Reg</>
                        ) : (
                          <><Power className="mr-2 h-4 w-4 text-green-500" /> Open Reg</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600" 
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
