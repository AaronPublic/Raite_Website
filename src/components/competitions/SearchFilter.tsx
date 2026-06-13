"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTransition } from "react";
import type { SelectRootChangeEventDetails } from "@base-ui/react/select";

interface SearchFilterProps {
  categories: string[];
}

export default function SearchFilter({ categories }: SearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleCategoryChange = (category: string | null, eventDetails: SelectRootChangeEventDetails) => {
    if (!category) return;
    const params = new URLSearchParams(searchParams);
    if (category && category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search competitions..."
          className="pl-10 h-11 md:h-12 text-sm md:text-base"
          defaultValue={searchParams.get("search")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="w-full md:w-64">
        <Select
          value={searchParams.get("category")?.toString() || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="h-11 md:h-12">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isPending && (
        <div className="flex items-center text-sm text-gray-500 animate-pulse">
          Filtering...
        </div>
      )}
    </div>
  );
}
