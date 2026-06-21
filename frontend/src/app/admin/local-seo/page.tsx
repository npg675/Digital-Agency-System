"use client";

import { useState } from "react";
import { 
  MapPin, 
  Search, 
  Store, 
  Star, 
  TrendingUp, 
  Activity,
  ChevronDown,
  Loader2,
  RefreshCw,
  Building
} from "lucide-react";

export default function LocalSEODashboard() {
  const [keyword, setKeyword] = useState("emergency plumber");
  const [location, setLocation] = useState("Austin, TX");
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !location) return;
    
    setIsScanning(true);
    setHasScanned(false);
    
    // Simulate network delay
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 2500);
  };

  // Generate a mock 5x5 grid of rankings
  const generateGrid = () => {
    const grid = [];
    // Center is best (1-3), edges get worse (4-15)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // Distance from center (2,2)
        const dist = Math.max(Math.abs(2 - row), Math.abs(2 - col));
        let baseRank = 1;
        if (dist === 1) baseRank = Math.floor(Math.random() * 3) + 2; // 2-4
        if (dist === 2) baseRank = Math.floor(Math.random() * 8) + 5; // 5-12
        grid.push({ row, col, rank: baseRank });
      }
    }
    return grid;
  };

  const [gridData] = useState(generateGrid());

  const getRankColor = (rank: number) => {
    if (rank <= 3) return "bg-emerald-500 text-white border-emerald-600";
    if (rank <= 10) return "bg-amber-400 text-amber-900 border-amber-500";
    return "bg-red-500 text-white border-red-600";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <MapPin className="w-8 h-8 text-indigo-500" />
            Local SEO & GMB
          </h1>
          <p className="text-zinc-500 mt-1">
            Track Google Maps rankings across your client's city and manage their business profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select className="appearance-none pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer text-zinc-900 dark:text-zinc-100">
              <option>Smith Plumbing Co.</option>
              <option>Texas Legal Partners</option>
              <option>Austin Fitness Club</option>
            </select>
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* GMB Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <Store className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Profile Health</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">92%</p>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">Optimized</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <Star className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Average Rating</h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">4.8</p>
              <div className="flex mb-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current opacity-50" />
              </div>
            </div>
            <span className="text-xs font-medium text-zinc-500 mb-1">124 reviews</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <Search className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Map Views (30d)</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">3,492</p>
            <span className="flex items-center text-xs font-bold text-emerald-600 mb-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Actions (Calls/Clicks)</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">428</p>
            <span className="flex items-center text-xs font-bold text-emerald-600 mb-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +5%
            </span>
          </div>
        </div>
      </div>

      {/* Local Ranking Grid */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row">
        
        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Local Grid Tracker
            </h2>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              See exactly where you rank in Google Maps based on where the searcher is standing.
            </p>
          </div>

          <form onSubmit={handleScan} className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Target Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Location / Center Point</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Grid Size</label>
              <select className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>5x5 Grid (1 mile radius)</option>
                <option>7x7 Grid (2 mile radius)</option>
                <option>9x9 Grid (5 mile radius)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-colors mt-6"
            >
              {isScanning ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Scanning Area...</>
              ) : (
                <><RefreshCw className="w-5 h-5" /> Run Scan</>
              )}
            </button>
          </form>

          {hasScanned && !isScanning && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Scan Results</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Average Rank:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">4.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Share of Local Voice:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">68%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 relative min-h-[400px] lg:min-h-full flex items-center justify-center overflow-hidden">
          {/* Mock Map Background Layer */}
          <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h80v80h-80z' fill='none' stroke='%23cbd5e1' stroke-width='1'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%23cbd5e1' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }} />

          {!hasScanned && !isScanning ? (
            <div className="relative z-10 flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 shadow-lg flex items-center justify-center mb-4 text-indigo-500">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Ready to Scan</h3>
              <p className="text-sm text-zinc-500 max-w-sm mt-1">Enter a keyword and location to generate a local ranking grid for this client.</p>
            </div>
          ) : isScanning ? (
            <div className="relative z-10 flex flex-col items-center text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Querying Google Maps APIs...</p>
            </div>
          ) : (
            <div className="relative z-10 p-8">
              {/* The Grid */}
              <div className="grid grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {gridData.map((node, i) => (
                  <div key={i} className="relative group">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-2xl font-black shadow-lg border-4 transition-transform hover:scale-110 cursor-pointer ${getRankColor(node.rank)}`}>
                      {node.rank}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-zinc-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl text-center">
                      <p className="font-bold">Rank #{node.rank}</p>
                      <p className="text-zinc-400">for "{keyword}"</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-950 px-4 py-2 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> 1-3 (Map Pack)</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> 4-10</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> 11+</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
