"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Trophy, Activity, Users, BarChart, Split } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ABTestDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${id}/ab-test-results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareWinner = async (winnerId: string) => {
    if (!confirm("Are you sure? This will archive all other variants and make this the only live page.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${id}/declare-winner?winner_id=${winnerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Winner declared successfully!");
        router.push("/admin/pages");
      } else {
        const err = await res.json();
        alert(`Failed: ${err.detail}`);
      }
    } catch (e) {
      alert("Network error");
    }
  };

  if (loading) return <div className="p-8">Loading A/B test data...</div>;
  if (!data) return <div className="p-8">Test data not found.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/pages" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Split className="w-8 h-8 text-indigo-500" />
            A/B Test Analytics
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Compare performance across variants to declare a winning page.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.variants.map((v: any) => (
          <div key={v.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {v.variant_name}
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{v.name}</h3>
                {v.is_primary && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Control</span>
                )}
                {v.status === 'ARCHIVED' && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">Archived</span>
                )}
              </div>
              <div className="flex gap-8 mt-6">
                <div>
                  <div className="text-zinc-500 text-sm flex items-center gap-1"><Users className="w-4 h-4"/> Views</div>
                  <div className="text-2xl font-bold">{v.views}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-sm flex items-center gap-1"><Activity className="w-4 h-4"/> Leads</div>
                  <div className="text-2xl font-bold">{v.leads}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-sm flex items-center gap-1"><BarChart className="w-4 h-4"/> Conversion Rate</div>
                  <div className="text-2xl font-bold text-green-600">{v.conversion_rate.toFixed(2)}%</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 min-w-[200px]">
              <Link href={`/admin/pages/${v.id}/editor`} className="w-full block">
                <Button variant="outline" className="w-full" nativeButton={false}>Edit Variant</Button>
              </Link>
              <Button onClick={() => handleDeclareWinner(v.id)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={v.status === 'ARCHIVED'} nativeButton={false}>
                <Trophy className="w-4 h-4 mr-2" />
                Declare Winner
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
