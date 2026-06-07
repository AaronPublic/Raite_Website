"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function SafeUserButton(props: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />;
  }

  return <UserButton {...props} />;
}
