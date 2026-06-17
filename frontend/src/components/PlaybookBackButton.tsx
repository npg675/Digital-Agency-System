"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function BackButtonContent() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "playbook") return null;

  return (
    <div className="p-8 pb-0 max-w-5xl mx-auto">
      <Link 
        href="/admin/marketing?tab=hints" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all border border-indigo-200 shadow-sm mb-2 hover:-translate-x-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to The A-Z Master Playbook
      </Link>
    </div>
  );
}

export function PlaybookBackButton() {
  return (
    <Suspense fallback={null}>
      <BackButtonContent />
    </Suspense>
  );
}
