"use client";

import { useEffect, useRef } from "react";

export function PageViewTracker({ pageId }: { pageId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    fetch(`${API}/analytics/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landing_page_id: pageId,
        referrer: document.referrer || null,
      }),
    }).catch((err) => console.error("Failed to track page view:", err));
  }, [pageId]);

  return null;
}
