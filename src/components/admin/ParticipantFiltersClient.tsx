"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { School } from "@prisma/client";
import { COURSES } from "@/lib/constants";

export default function ParticipantFiltersClient({ schools }: { schools: School[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("search")?.toString() || "");

  // Sync search input state if the search params change externally (e.g. clear filters)
  useEffect(() => {
    setSearchValue(searchParams.get("search")?.toString() || "");
  }, [searchParams]);

  // Debounce search input to avoid triggering database queries on every single keystroke
  useEffect(() => {
    const currentParam = searchParams.get("search") || "";
    if (searchValue === currentParam) return;

    const delayDebounceFn = setTimeout(() => {
      updateFilters({ search: searchValue || null });
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

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
            placeholder="Search by name or school..."
            className="pl-10"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={searchParams.get("school")?.toString() || "all"}
            onValueChange={(v) => updateFilters({ school: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="School" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.name}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("course")?.toString() || "all"}
            onValueChange={(v) => updateFilters({ course: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {COURSES.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("role")?.toString() || "all"}
            onValueChange={(v) => updateFilters({ role: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classifications</SelectItem>
              <SelectItem value="PARTICIPANT">Participant</SelectItem>
              <SelectItem value="FACULTY_COACH">Faculty Coach</SelectItem>
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
