"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export default function ParticipantFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 on filter change
    params.set("page", "1");
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search name or email..."
            className="pl-10"
            defaultValue={searchParams.get("search")?.toString()}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Select
            defaultValue={searchParams.get("school")?.toString() || "all"}
            onValueChange={(v) => updateFilters({ school: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="School" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              <SelectItem value="University of the Assumption">UA</SelectItem>
              <SelectItem value="Holy Angel University">HAU</SelectItem>
              {/* Add more schools or fetch dynamically */}
            </SelectContent>
          </Select>
          <Select
            defaultValue={searchParams.get("yearLevel")?.toString() || "all"}
            onValueChange={(v) => updateFilters({ yearLevel: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Year Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1st Year">1st Year</SelectItem>
              <SelectItem value="2nd Year">2nd Year</SelectItem>
              <SelectItem value="3rd Year">3rd Year</SelectItem>
              <SelectItem value="4th Year">4th Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {isPending && <p className="text-xs text-blue-600 animate-pulse">Updating results...</p>}
    </div>
  );
}
