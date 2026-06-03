"use client";

import { Announcement } from "@prisma/client";
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
import { MoreHorizontal, Edit, Pin, PinOff, Archive, ArchiveRestore } from "lucide-react";
import { togglePinAnnouncement, toggleArchiveAnnouncement } from "@/app/actions/announcements";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface AnnouncementsTableProps {
  announcements: Announcement[];
}

export default function AnnouncementsTable({ announcements }: AnnouncementsTableProps) {
  const router = useRouter();

  const handlePin = async (id: string, current: boolean) => {
    const result = await togglePinAnnouncement(id, !current);
    if (result.success) {
      toast.success(current ? "Announcement unpinned" : "Announcement pinned");
      router.refresh();
    }
  };

  const handleArchive = async (id: string, current: boolean) => {
    const result = await toggleArchiveAnnouncement(id, !current);
    if (result.success) {
      toast.success(current ? "Announcement restored" : "Announcement archived");
      router.refresh();
    }
  };

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-bold">Title</TableHead>
            <TableHead className="font-bold">Pinned</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold">Created At</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No announcements found.
              </TableCell>
            </TableRow>
          ) : (
            announcements.map((announcement) => (
              <TableRow key={announcement.id} className="hover:bg-gray-50/30 transition-colors">
                <TableCell className="font-medium">{announcement.title}</TableCell>
                <TableCell>
                  {announcement.pinned ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Yes</Badge>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={announcement.isArchived ? "secondary" : "default"}>
                    {announcement.isArchived ? "Archived" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(announcement.createdAt).toLocaleDateString()}
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
                        <Link href={`/admin/announcements/${announcement.id}/edit`} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePin(announcement.id, announcement.pinned)}>
                        {announcement.pinned ? (
                          <><PinOff className="mr-2 h-4 w-4" /> Unpin</>
                        ) : (
                          <><Pin className="mr-2 h-4 w-4" /> Pin</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(announcement.id, announcement.isArchived)}>
                        {announcement.isArchived ? (
                          <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore</>
                        ) : (
                          <><Archive className="mr-2 h-4 w-4 text-orange-500" /> Archive</>
                        )}
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
