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
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
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
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Title</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Pinned</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Status</TableHead>
            <TableHead className="font-bold text-gray-900 dark:text-gray-100">Created At</TableHead>
            <TableHead className="text-right font-bold text-gray-900 dark:text-gray-100">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500 dark:text-gray-400">
                No announcements found.
              </TableCell>
            </TableRow>
          ) : (
            announcements.map((announcement) => (
              <TableRow key={announcement.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800">
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{announcement.title}</TableCell>
                <TableCell>
                  {announcement.pinned ? (
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">Yes</Badge>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm italic">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={announcement.isArchived ? "secondary" : "default"}>
                    {announcement.isArchived ? "Archived" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/announcements/${announcement.id}/edit`} className="flex items-center text-gray-900 dark:text-gray-100">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePin(announcement.id, announcement.pinned)} className="text-gray-900 dark:text-gray-100">
                        {announcement.pinned ? (
                          <><PinOff className="mr-2 h-4 w-4" /> Unpin</>
                        ) : (
                          <><Pin className="mr-2 h-4 w-4" /> Pin</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(announcement.id, announcement.isArchived)} className="text-gray-900 dark:text-gray-100">
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
