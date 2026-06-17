"use client";

import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070B14]/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search ticker, report, thesis..."
            className="border-white/10 bg-white/[0.04] pl-9 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="ml-4 flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-100">
            S
          </div>
        </div>
      </div>
    </header>
  );
}