import React, { useState } from "react";
import {
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  PieChart,
  Activity,
  DollarSign,
  Calendar
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { NetWorthItem, NetWorthHistory, AssetCategory, LiabilityCategory } from "../types";

interface NetWorthPageProps {
  netWorthItems: NetWorthItem[];
  history: NetWorthHistory[];
  onAddItem: (item: Omit<NetWorthItem, "id">) => void;
  onEditItem: (id: string, updated: Omit<NetWorthItem, "id">) => void;
  onDeleteItem: (id: string) => void;
  currencySymbol: string;
  assetCategories: string[];
  onAddAssetCategory: (cat: string) => void;
  onDeleteAssetCategory: (cat: string) => void;
  liabilityCategories: string[];
  onAddLiabilityCategory: (cat: string) => void;
  onDeleteLiabilityCategory: (cat: string) => void;
}

export default function NetWorthPage({
  netWorthItems,
  history,
  onAddItem,
  onEditItem,
  onDeleteItem,
  currencySymbol = "$",
  assetCategories,
  onAddAssetCategory,
  onDeleteAssetCategory,
  liabilityCategories,
  onAddLiabilityCategory,
  onDeleteLiabilityCategory
}: NetWorthPageProps) {
  // Input State
  const [itemLabel, setItemLabel] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemType, setItemType] = useState<"Asset" | "Liability">("Asset");
  
  // Category defaults
  const [assetCategory, setAssetCategory] = useState<string>(assetCategories[0] || "Cash & Cash Equivalents");
  const [liabilityCategory, setLiabilityCategory] = useState<string>(liabilityCategories[0] || "Credit Card Balances");
  
  // Date Input Timestamp (Default to today's local date)
  const [itemDate, setItemDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Collapsible toggle state for past records
  const [showArchived, setShowArchived] = useState(false);

  const [showNewAssetCategoryField, setShowNewAssetCategoryField] = useState(false);
  const [newAssetCategoryName, setNewAssetCategoryName] = useState("");
  const [showNewLiabilityCategoryField, setShowNewLiabilityCategoryField] = useState(false);
  const [newLiabilityCategoryName, setNewLiabilityCategoryName] = useState("");

  const [showNewEditAssetCategoryField, setShowNewEditAssetCategoryField] = useState(false);
  const [newEditAssetCategoryName, setNewEditAssetCategoryName] = useState("");
  const [showNewEditLiabilityCategoryField, setShowNewEditLiabilityCategoryField] = useState(false);
  const [newEditLiabilityCategoryName, setNewEditLiabilityCategoryName] = useState("");

  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemLabel, setEditingItemLabel] = useState("");
  const [editingItemValue, setEditingItemValue] = useState("");
  const [editingItemType, setEditingItemType] = useState<"Asset" | "Liability">("Asset");
  const [editingItemAssetCategory, setEditingItemAssetCategory] = useState<string>("Cash & Cash Equivalents");
  const [editingItemLiabilityCategory, setEditingItemLiabilityCategory] = useState<string>("Credit Card Balances");
  const [editingItemDate, setEditingItemDate] = useState("");

  const startEditItem = (item: NetWorthItem) => {
    setEditingItemId(item.id);
    setEditingItemLabel(item.label);
    setEditingItemValue(item.value.toString());
    setEditingItemType(item.type);
    if (item.type === "Asset") {
      setEditingItemAssetCategory(item.category);
    } else {
      setEditingItemLiabilityCategory(item.category);
    }
    setEditingItemDate(item.date || new Date().toISOString().split("T")[0]);
  };

  // Group Same-Labeled Items to segregate active newest entries vs historical past ledgers!
  // This guarantees that past valuations of the same holding name are stored for timeline calculation but don't clutter current assets lists.
  const groupedByKey: Record<string, NetWorthItem[]> = {};
  netWorthItems.forEach((item) => {
    const key = `${item.type}-${item.label.trim().toLowerCase()}`;
    if (!groupedByKey[key]) {
      groupedByKey[key] = [];
    }
    groupedByKey[key].push(item);
  });

  const activeNewestItems: NetWorthItem[] = [];
  const archivedPastItems: NetWorthItem[] = [];

  Object.values(groupedByKey).forEach((itemsList) => {
    // Sort descending by date (newest first). If dates are equal, sort descending by ID.
    const sorted = [...itemsList].sort((a, b) => {
      const dateA = new Date(a.date || "").getTime() || 0;
      const dateB = new Date(b.date || "").getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });

    const newest = sorted[0];
    if (newest.value === 0) {
      // It has gone to zero! Move it and its past records to the hidden ledger so it doesn't take up space in the active ledgers
      sorted.forEach((item) => archivedPastItems.push(item));
    } else {
      // Newest is current active value
      activeNewestItems.push(newest);
      // Remainder is moved to archived past versions
      sorted.slice(1).forEach((pastItem) => archivedPastItems.push(pastItem));
    }
  });

  // Current calculations based strictly on current Active values!
  const totalAssets = activeNewestItems
    .filter((item) => item.type === "Asset")
    .reduce((sum, item) => sum + item.value, 0);

  const totalLiabilities = activeNewestItems
    .filter((item) => item.type === "Liability")
    .reduce((sum, item) => sum + item.value, 0);

  const netWealth = totalAssets - totalLiabilities;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemLabel.trim() || !itemValue) return;

    const val = parseFloat(itemValue);
    if (isNaN(val) || val < 0) return;

    const selectedCategory = itemType === "Asset" ? assetCategory : liabilityCategory;

    onAddItem({
      type: itemType,
      category: selectedCategory,
      label: itemLabel,
      value: val,
      date: itemDate || new Date().toISOString().split("T")[0]
    });

    setItemLabel("");
    setItemValue("");
    // Keep date persistent for batch entries or default back to current day
    const today = new Date();
    setItemDate(today.toISOString().split("T")[0]);
  };



  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${months[monthIndex]} ${day}, ${year}`;
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Recharts custom Tooltip styled nicely to match our design guidelines
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let displayDate = "";
      try {
        const numVal = typeof label === "number" ? label : Number(label);
        if (!isNaN(numVal)) {
          const d = new Date(numVal);
          if (!isNaN(d.getTime())) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            displayDate = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
          } else {
            displayDate = formatDateString(label);
          }
        } else {
          displayDate = formatDateString(label);
        }
      } catch {
        displayDate = formatDateString(label);
      }

      return (
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-xs font-sans shadow-lg text-slate-800">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{displayDate}</p>
          {payload.map((entry: any, index: number) => {
            let color = "text-emerald-600";
            if (entry.dataKey === "liabilities") color = "text-rose-500";
            if (entry.dataKey === "netWorth") color = "text-blue-600 font-sans";

            return (
              <p key={`tooltip-${index}`} className="flex justify-between gap-6 py-1">
                <span className="text-slate-500 font-medium">{entry.name}:</span>
                <span className={`font-semibold ${color}`}>
                  {currencySymbol}
                  {entry.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Build full dataset for line history including Net Worth calculation & timestamp for proportional Recharts timeline
  const mappedChartData = history.map((h) => {
    let dateObj = new Date();
    const cleanMonth = (h.month || "").trim();
    const parts = cleanMonth.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const key = cleanMonth.toLowerCase().slice(0, 3);
      if (monthMap[key] !== undefined) {
        dateObj = new Date(2026, monthMap[key], 15);
      } else {
        const parsed = Date.parse(cleanMonth);
        if (!isNaN(parsed)) {
          dateObj = new Date(parsed);
        }
      }
    }
    const timestamp = dateObj.getTime();

    return {
      ...h,
      timestamp,
      netWorth: h.assets - h.liabilities
    };
  });

  const validChartData = mappedChartData.filter((d) => !isNaN(d.timestamp));
  const timestamps = validChartData.map((d) => d.timestamp);
  const minTime = timestamps.length ? Math.min(...timestamps) : 0;
  const maxTime = timestamps.length ? Math.max(...timestamps) : 0;
  const dayMs = 24 * 60 * 60 * 1000;
  const xAxisDomain = minTime === maxTime ? [minTime - dayMs, maxTime + dayMs] : [minTime, maxTime];

  const assetsList = activeNewestItems.filter((i) => i.type === "Asset");
  const liabilitiesList = activeNewestItems.filter((i) => i.type === "Liability");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Assets card */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Active Portfolio Assets</span>
            <div className="p-1 px-2.5 text-[9.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 rounded font-bold uppercase tracking-wider">
              Owned
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 font-sans tracking-tight mt-3">
            {currencySymbol}
            {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-slate-505 text-[11px] mt-2 flex items-center gap-1.5 font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cash savings, retirement pools, houses & cars</span>
          </div>
        </div>

        {/* Total Liabilities card */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Recorded Liabilities</span>
            <div className="p-1 px-2.5 text-[9.5px] bg-rose-50 text-rose-500 border border-rose-100 rounded font-bold uppercase tracking-wider">
              Owed
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 font-sans tracking-tight mt-3">
            {currencySymbol}
            {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-slate-505 text-[11px] mt-2 flex items-center gap-1.5 font-semibold">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Credit balances, student/car loans & mortgages</span>
          </div>
        </div>

        {/* Net Wealth card */}
        <div className="bg-white border border-blue-100 p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Calculated Net Worth</span>
            <div className="p-1 px-2.5 text-[9.5px] bg-blue-50 text-blue-600 border border-blue-100 rounded font-bold uppercase tracking-wider">
              Liquid Equity
            </div>
          </div>
          <p className={`text-2xl font-black font-sans tracking-tight mt-3 ${netWealth >= 0 ? 'text-blue-600 animate-pulse' : 'text-rose-500'}`}>
            {currencySymbol}
            {netWealth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-slate-500 text-[11px] mt-2 flex items-center gap-1.5 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Actual baseline capitalization (Assets minus Liabilities)</span>
          </div>
        </div>

      </div>

      {/* Recharts Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" style={{ contentVisibility: "auto" }}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-800">Equity & Net Worth Timeline</h3>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block font-semibold">Historical valuation trend progress ledger</div>
        </div>

        <div className="w-full h-80">
          {history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              Record history observations to generate the trend timelines.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={validChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorLiabilities" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="timestamp"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  domain={xAxisDomain}
                  scale="time"
                  tickFormatter={(val) => {
                    try {
                      const dateObj = new Date(val);
                      if (isNaN(dateObj.getTime())) return "";
                      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      return `${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
                    } catch {
                      return "";
                    }
                  }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", wrapperPadding: 8, fontWeight: 600 }} />
                <Area
                  type="monotone"
                  name="Gross Assets"
                  dataKey="assets"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAssets)"
                />
                <Area
                  type="monotone"
                  name="Gross Liabilities"
                  dataKey="liabilities"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLiabilities)"
                />
                <Area
                  type="monotone"
                  name="Net Asset Equity"
                  dataKey="netWorth"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Asset / Liability Lists + Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Item Adder Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Append Portfolio Item</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nw-item-label" className="block text-xs font-bold text-slate-500 mb-1">Portfolio Asset/Debt Label</label>
              <input
                id="nw-item-label"
                type="text"
                placeholder="e.g. Robinhood Portfolio, Amex Credit"
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-xs outline-none transition font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-500 block col-span-2">Equity Class Classification</label>
              <button
                type="button"
                onClick={() => setItemType("Asset")}
                className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 border ${
                  itemType === "Asset"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Capital Asset
              </button>
              <button
                type="button"
                onClick={() => setItemType("Liability")}
                className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 border ${
                  itemType === "Liability"
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Active Liability
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nw-item-val" className="block text-xs font-bold text-slate-500 mb-1">Valuation Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-xs">{currencySymbol}</span>
                  <input
                    id="nw-item-val"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemValue}
                    onChange={(e) => setItemValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-xs outline-none transition font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nw-item-date" className="block text-xs font-bold text-slate-500 mb-1">Timestamp Date</label>
                <input
                  id="nw-item-date"
                  type="date"
                  value={itemDate}
                  onChange={(e) => setItemDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-xs outline-none transition font-semibold cursor-pointer"
                  required
                />
              </div>
            </div>

            {itemType === "Asset" ? (
              <div className="space-y-1.5">
                <label id="nw-asset-lbl" className="block text-xs font-bold text-slate-500 mb-0.5">Asset Allocation Group</label>
                <select
                  aria-labelledby="nw-asset-lbl"
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold"
                >
                  {assetCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="flex justify-between items-center mt-1">
                  {assetCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${assetCategory}" asset category?`)) {
                          onDeleteAssetCategory(assetCategory);
                          const remaining = assetCategories.filter(c => c !== assetCategory);
                          if (remaining.length > 0) {
                            setAssetCategory(remaining[0]);
                          }
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Remove Category
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewAssetCategoryField(!showNewAssetCategoryField)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold transition cursor-pointer ml-auto"
                  >
                    + Add Custom Category
                  </button>
                </div>

                {showNewAssetCategoryField && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">New Asset Category</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newAssetCategoryName}
                        onChange={(e) => setNewAssetCategoryName(e.target.value)}
                        placeholder="e.g. Fine Art, Crypto"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newAssetCategoryName.trim();
                            if (trimmed && !assetCategories.includes(trimmed)) {
                              onAddAssetCategory(trimmed);
                              setAssetCategory(trimmed);
                              setNewAssetCategoryName("");
                              setShowNewAssetCategoryField(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newAssetCategoryName.trim();
                          if (trimmed && !assetCategories.includes(trimmed)) {
                            onAddAssetCategory(trimmed);
                            setAssetCategory(trimmed);
                            setNewAssetCategoryName("");
                            setShowNewAssetCategoryField(false);
                          }
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAssetCategoryField(false);
                          setNewAssetCategoryName("");
                        }}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label id="nw-liab-lbl" className="block text-xs font-bold text-slate-500 mb-0.5">Debt Liability Group</label>
                <select
                  aria-labelledby="nw-liab-lbl"
                  value={liabilityCategory}
                  onChange={(e) => setLiabilityCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold"
                >
                  {liabilityCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="flex justify-between items-center mt-1">
                  {liabilityCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${liabilityCategory}" liability category?`)) {
                          onDeleteLiabilityCategory(liabilityCategory);
                          const remaining = liabilityCategories.filter(c => c !== liabilityCategory);
                          if (remaining.length > 0) {
                            setLiabilityCategory(remaining[0]);
                          }
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Remove Category
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewLiabilityCategoryField(!showNewLiabilityCategoryField)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold transition cursor-pointer ml-auto"
                  >
                    + Add Custom Category
                  </button>
                </div>

                {showNewLiabilityCategoryField && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">New Liability Category</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newLiabilityCategoryName}
                        onChange={(e) => setNewLiabilityCategoryName(e.target.value)}
                        placeholder="e.g. Tax Debt, Medical"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newLiabilityCategoryName.trim();
                            if (trimmed && !liabilityCategories.includes(trimmed)) {
                              onAddLiabilityCategory(trimmed);
                              setLiabilityCategory(trimmed);
                              setNewLiabilityCategoryName("");
                              setShowNewLiabilityCategoryField(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newLiabilityCategoryName.trim();
                          if (trimmed && !liabilityCategories.includes(trimmed)) {
                            onAddLiabilityCategory(trimmed);
                            setLiabilityCategory(trimmed);
                            setNewLiabilityCategoryName("");
                            setShowNewLiabilityCategoryField(false);
                          }
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewLiabilityCategoryField(false);
                          setNewLiabilityCategoryName("");
                        }}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              id="btn-add-nw-item"
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Inject Portfolio Valuation
            </button>
          </form>
        </div>

        {/* Assets Ledger list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            Assets Ledger ({assetsList.length})
          </h3>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {assetsList.length === 0 ? (
              <div className="py-8 text-center text-slate-404 text-xs italic">
                No active asset holdings declared. Add one above.
              </div>
            ) : (
              assetsList.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:border-slate-250 hover:bg-slate-100/40 transition group">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-700">{item.label}</span>
                    <span className="text-[9px] text-slate-505 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase inline-block">
                      {item.category}
                    </span>
                    <span className="block text-[8px] font-mono text-slate-400 font-bold">
                      Latest: {item.date || "Default"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-emerald-650 font-bold text-xs mr-1">
                      {currencySymbol}
                      {item.value.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </span>
                    <button
                      onClick={() => startEditItem(item)}
                      className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition duration-150 cursor-pointer"
                      aria-label={`Edit ${item.label}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition duration-150 cursor-pointer"
                      aria-label={`Remove asset ${item.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Liabilities Ledger list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
            Liabilities Ledger ({liabilitiesList.length})
          </h3>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {liabilitiesList.length === 0 ? (
              <div className="py-8 text-center text-slate-404 text-xs italic">
                No active liabilities recorded. Squeaky clean!
              </div>
            ) : (
              liabilitiesList.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:border-slate-250 hover:bg-slate-100/40 transition group">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-700">{item.label}</span>
                    <span className="text-[9px] text-slate-505 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase inline-block">
                      {item.category}
                    </span>
                    <span className="block text-[8px] font-mono text-slate-400 font-bold">
                      Latest: {item.date || "Default"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-rose-500 font-bold text-xs mr-1">
                      {currencySymbol}
                      {item.value.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </span>
                    <button
                      onClick={() => startEditItem(item)}
                      className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition duration-150 cursor-pointer"
                      aria-label={`Edit ${item.label}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition duration-150 cursor-pointer"
                      aria-label={`Remove liability ${item.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Historical Ledger of Superseded Entries */}
      {archivedPastItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between text-slate-800 font-bold text-sm cursor-pointer hover:text-blue-600 transition outline-none"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500 animate-pulse" />
              <span>Collapsible Historical Registry of Superseded Valuations</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                {archivedPastItems.length} Past Records Hidden
              </span>
            </div>
            <span className="text-xs text-blue-600 font-bold">{showArchived ? "Hide Records" : "Show Records"}</span>
          </button>

          {showArchived && (
            <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <p className="text-xs text-slate-500 mb-4 font-semibold">
                These are historically preceding entries matching active portfolio labels. Archived of record to preserve timeline fidelity.
              </p>
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                    <th className="py-2">Date Timestamp</th>
                    <th className="py-2">Holding Name</th>
                    <th className="py-2">Category Set</th>
                    <th className="py-2">Class</th>
                    <th className="py-2 text-right">Historical Close Value</th>
                    <th className="py-2 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {archivedPastItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 font-mono text-[10px] text-slate-500 font-bold">{item.date}</td>
                      <td className="py-2.5 font-bold text-slate-800">{item.label}</td>
                      <td className="py-2.5 text-slate-500">{item.category}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${item.type === "Asset" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-sans font-bold ${item.type === "Asset" ? "text-emerald-650" : "text-rose-500"}`}>
                        {currencySymbol}{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEditItem(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded transition cursor-pointer"
                            aria-label={`Edit archived ${item.label}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition cursor-pointer"
                            aria-label={`Delete archived ${item.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Fully Configured Net Worth Edit Overlay Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition duration-300" id="edit-nw-item-modal">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Modify Portfolio Valuation Row
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Portfolio Asset/Debt Label</label>
                <input
                  type="text"
                  value={editingItemLabel}
                  onChange={(e) => setEditingItemLabel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-xs outline-none transition font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-500 block col-span-2">Equity Class Classification</label>
                <button
                  type="button"
                  onClick={() => setEditingItemType("Asset")}
                  className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 border ${
                    editingItemType === "Asset"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Capital Asset
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItemType("Liability")}
                  className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 border ${
                    editingItemType === "Liability"
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Active Liability
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Valuation Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-xs">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItemValue}
                      onChange={(e) => setEditingItemValue(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-xs outline-none transition font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Timestamp Date</label>
                  <input
                    type="date"
                    value={editingItemDate}
                    onChange={(e) => setEditingItemDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-xs outline-none transition font-semibold cursor-pointer"
                  />
                </div>
              </div>

              {editingItemType === "Asset" ? (
                <div>
                  <label id="nw-edit-asset-lbl" className="block text-xs font-bold text-slate-500 mb-1">Asset Allocation Group</label>
                  <select
                    aria-labelledby="nw-edit-asset-lbl"
                    value={editingItemAssetCategory}
                    onChange={(e) => setEditingItemAssetCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold text-xs font-sans"
                  >
                    {assetCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label id="nw-edit-liab-lbl" className="block text-xs font-bold text-slate-500 mb-1">Debt Liability Group</label>
                  <select
                    aria-labelledby="nw-edit-liab-lbl"
                    value={editingItemLiabilityCategory}
                    onChange={(e) => setEditingItemLiabilityCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold text-xs font-sans"
                  >
                    {liabilityCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingItemId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-250 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const val = parseFloat(editingItemValue);
                    if (!editingItemLabel.trim() || isNaN(val) || val < 0) return;
                    onEditItem(editingItemId, {
                      type: editingItemType,
                      category: editingItemType === "Asset" ? editingItemAssetCategory : editingItemLiabilityCategory,
                      label: editingItemLabel,
                      value: val,
                      date: editingItemDate
                    });
                    setEditingItemId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
