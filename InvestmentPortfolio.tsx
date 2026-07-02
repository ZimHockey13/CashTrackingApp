import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Coins, 
  Briefcase, 
  TrendingUp, 
  PieChart as ChartIcon, 
  HelpCircle,
  FolderOpen,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  Settings
} from "lucide-react";
import { PortfolioItem } from "../types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface InvestmentPortfolioProps {
  currencySymbol: string;
  onApplyToNetWorth?: (totalValue: number) => void;
}

// Default classification categories
const DEFAULT_CATEGORIES = [
  "Cash / Money Market",
  "Large Cap Equities",
  "Dividend Growth",
  "Growth / Tech",
  "Crypto Assets",
  "Precious Metals / Gold",
  "Real Estate",
  "Collectibles / Valuables",
  "Other"
];

// Helper to consolidate portfolio items with the same ticker (symbol)
const combineDuplicates = (items: PortfolioItem[]): PortfolioItem[] => {
  const merged: Record<string, PortfolioItem> = {};
  items.forEach(item => {
    const sym = item.symbol.trim().toUpperCase();
    if (!merged[sym]) {
      merged[sym] = {
        ...item,
        symbol: sym,
      };
    } else {
      merged[sym] = {
        ...merged[sym],
        currentValue: merged[sym].currentValue + item.currentValue,
        quantity: item.quantity !== undefined ? (merged[sym].quantity || 0) + item.quantity : merged[sym].quantity,
        totalGainLossDollar: item.totalGainLossDollar !== undefined ? (merged[sym].totalGainLossDollar || 0) + item.totalGainLossDollar : merged[sym].totalGainLossDollar,
        description: merged[sym].description || item.description,
        isManual: merged[sym].isManual || item.isManual
      };
    }
  });
  return Object.values(merged);
};

// Aesthetic colors for the donut slices
const ALLOCATION_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#64748B"  // Slate
];

export default function InvestmentPortfolio({ currencySymbol, onApplyToNetWorth }: InvestmentPortfolioProps) {
  const symbol = currencySymbol || "$";

  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  
  // Custom categories CRUD state
  const [newCatName, setNewCatName] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);

  // Manual asset form state
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualAccount, setManualAccount] = useState("Direct Ownership");
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualValuation, setManualValuation] = useState("");
  const [manualCategory, setManualCategory] = useState(DEFAULT_CATEGORIES[6]); // Real Estate default

  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValuation, setEditValuation] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("pf_portfolio_items");
      const savedCategories = localStorage.getItem("pf_portfolio_categories");
      
      if (savedItems) {
        setPortfolioItems(combineDuplicates(JSON.parse(savedItems)));
      } else {
        // Seed some sample data representing the provided spreadsheet to make it look immediately gorgeous
        const sampleSeed: PortfolioItem[] = [
          {
            id: "seed-1",
            accountNumber: "xxxx",
            accountName: "Cash Management (Individual)",
            symbol: "SPAXX**",
            description: "HELD IN MONEY MARKET",
            currentValue: 17460.51,
            customCategory: "Cash / Money Market",
            type: "Cash",
            isManual: false
          },
          {
            id: "seed-2",
            accountNumber: "xxxx",
            accountName: "Cash Management (Individual)",
            symbol: "SCHD",
            description: "SCHWAB US DIVIDEND EQUITY ETF",
            quantity: 289.792,
            lastPrice: 31.89,
            currentValue: 9240.01,
            totalGainLossDollar: 1267.53,
            totalGainLossPercent: 15.89,
            customCategory: "Dividend Growth",
            type: "Cash",
            isManual: false
          },
          {
            id: "seed-3",
            accountNumber: "xxxx",
            accountName: "Fidelity Crypto®",
            symbol: "BTC/USD",
            description: "BITCOIN",
            quantity: 0.07232042,
            lastPrice: 64405.08,
            currentValue: 4657.80,
            totalGainLossDollar: -742.20,
            totalGainLossPercent: -13.75,
            customCategory: "Crypto Assets",
            type: "Cash",
            isManual: false
          },
          {
            id: "seed-4",
            accountNumber: "xxxx",
            accountName: "ROTH IRA",
            symbol: "IAUM",
            description: "ISHARES GOLD TR SHARES REPRESENT",
            quantity: 50.0,
            lastPrice: 41.75,
            currentValue: 2087.25,
            totalGainLossDollar: -138.25,
            totalGainLossPercent: -6.22,
            customCategory: "Precious Metals / Gold",
            type: "Cash",
            isManual: false
          },
          {
            id: "seed-5",
            accountNumber: "Direct Ownership",
            accountName: "Direct Ownership",
            symbol: "PROP-1",
            description: "Residential Rental Property valuation",
            currentValue: 320000.0,
            customCategory: "Real Estate",
            isManual: true
          },
          {
            id: "seed-6",
            accountNumber: "Direct Ownership",
            accountName: "Direct Ownership",
            symbol: "ROLEX-SUB",
            description: "Rolex Submariner 116610LN",
            currentValue: 12500.0,
            customCategory: "Collectibles / Valuables",
            isManual: true
          }
        ];
        setPortfolioItems(combineDuplicates(sampleSeed));
      }

      if (savedCategories) {
        setCustomCategories(JSON.parse(savedCategories));
      }
    } catch (e) {
      console.error("Hydration of investment portfolio failed", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("pf_portfolio_items", JSON.stringify(portfolioItems));
  }, [portfolioItems, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("pf_portfolio_categories", JSON.stringify(customCategories));
  }, [customCategories, isLoaded]);

  // Utility to parse CSV rows while preserving double-quoted fields containing commas (e.g., "$17,460.51")
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(val => val.trim().replace(/^"|"$/g, ''));
  };

  const cleanNumber = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[\$,%\+]/g, '').replace(/\s/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Heuristic custom category tagging on CSV Import
  const autoTagCategory = (symbol: string, description: string): string => {
    const sym = (symbol || "").toUpperCase();
    const desc = (description || "").toUpperCase();

    if (sym.includes("SPAXX") || sym.includes("FDRXX") || sym.includes("FCASH") || sym.includes("USD") || desc.includes("MONEY MARKET") || desc.includes("CASH")) {
      return "Cash / Money Market";
    }
    if (sym.includes("BTC") || sym.includes("ETH") || sym.includes("SOL") || sym.includes("DOGE") || desc.includes("BITCOIN") || desc.includes("CRYPTO") || desc.includes("COIN")) {
      return "Crypto Assets";
    }
    if (sym === "SCHD" || sym === "VYM" || sym === "DGRO" || desc.includes("DIVIDEND")) {
      return "Dividend Growth";
    }
    if (sym === "IAUM" || sym === "GLD" || sym === "IAU" || sym === "SLV" || desc.includes("GOLD") || desc.includes("SILVER")) {
      return "Precious Metals / Gold";
    }
    if (sym === "QQQ" || sym === "QQQM" || sym === "AMZN" || sym === "AAPL" || sym === "MSFT" || sym === "NVDA" || sym === "GOOG" || desc.includes("NASDAQ") || desc.includes("MOMENTUM") || desc.includes("GROWTH")) {
      return "Growth / Tech";
    }
    if (sym === "VOO" || sym === "SPY" || sym === "IVV" || sym === "SCHX" || desc.includes("S&P 500") || desc.includes("INDEX") || desc.includes("LARGE-CAP")) {
      return "Large Cap Equities";
    }
    return "Other";
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportFeedback({ type: "error", message: "Unable to read file contents." });
        return;
      }

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          setImportFeedback({ type: "error", message: "CSV file appears empty or corrupt." });
          return;
        }

        // Find the header row to verify and index properly
        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes("account number") && lines[i].toLowerCase().includes("symbol")) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          setImportFeedback({ type: "error", message: "Invalid CSV format. Missing required 'Account Number' and 'Symbol' headers." });
          return;
        }

        const headers = parseCSVLine(lines[headerIndex]);
        const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());

        const idxAccNum = getIdx("Account Number");
        const idxAccName = getIdx("Account Name");
        const idxSymbol = getIdx("Symbol");
        const idxDesc = getIdx("Description");
        const idxQty = getIdx("Quantity");
        const idxPrice = getIdx("Last Price");
        const idxValue = getIdx("Current Value");
        const idxTotalGainDollar = getIdx("Total Gain/Loss Dollar");
        const idxTotalGainPercent = getIdx("Total Gain/Loss Percent");
        const idxType = getIdx("Type");

        // We want to preserve user classifications! Create a mapping of key: Symbol_AccountName -> customCategory
        const currentClassifications: Record<string, string> = {};
        portfolioItems.forEach(item => {
          if (!item.isManual) {
            const key = `${item.symbol}_${item.accountName}`.toUpperCase();
            currentClassifications[key] = item.customCategory;
          }
        });

        const parsedItems: PortfolioItem[] = [];

        // Parse data rows
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Stop parsing if we hit empty footer spacer, Fidelity disclosure paragraphs, or timestamp lines
          if (line.startsWith(",") || line.startsWith('"Brokerage services') || line.startsWith('"The data and information') || line.startsWith('"Fidelity Crypto®') || line.toLowerCase().includes("date downloaded")) {
            break;
          }

          const cols = parseCSVLine(lines[i]);
          if (cols.length < Math.max(idxAccNum, idxSymbol, idxValue)) continue;

          const symbol = cols[idxSymbol];
          if (!symbol || symbol.trim() === "") continue;

          const accountName = cols[idxAccName] || "Unknown Account";
          const description = cols[idxDesc] || "";
          const currentValue = cleanNumber(cols[idxValue]);

          if (currentValue <= 0) continue; // Skip zero/negative value accounts or placeholders

          // Check if we already have a custom classification memory for this symbol+account
          const mappingKey = `${symbol}_${accountName}`.toUpperCase();
          const savedCat = currentClassifications[mappingKey];
          const customCategory = savedCat || autoTagCategory(symbol, description);

          parsedItems.push({
            id: `csv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            accountNumber: cols[idxAccNum] || "xxxx",
            accountName,
            symbol,
            description,
            quantity: cols[idxQty] ? cleanNumber(cols[idxQty]) : undefined,
            lastPrice: cols[idxPrice] ? cleanNumber(cols[idxPrice]) : undefined,
            currentValue,
            totalGainLossDollar: cols[idxTotalGainDollar] ? cleanNumber(cols[idxTotalGainDollar]) : undefined,
            totalGainLossPercent: cols[idxTotalGainPercent] ? cleanNumber(cols[idxTotalGainPercent]) : undefined,
            customCategory,
            type: cols[idxType] || undefined,
            isManual: false
          });
        }

        // Keep manual items from the previous list!
        const manualItems = portfolioItems.filter(item => item.isManual);
        
        // Combine newly imported CSV items with manual items and aggregate duplicates
        setPortfolioItems(combineDuplicates([...parsedItems, ...manualItems]));
        setImportFeedback({
          type: "success",
          message: `Successfully imported and consolidated ${parsedItems.length} active positions. Retained ${manualItems.length} manual assets.`
        });

        // Auto-close feedback alert after 5 seconds
        setTimeout(() => setImportFeedback(null), 7000);

      } catch (err) {
        console.error("Failed to parse Fidelity CSV", err);
        setImportFeedback({ type: "error", message: "CSV parsing failed. Ensure you are using the official exported spreadsheet structure." });
      }
    };
    reader.readAsText(file);
  };

  const handleAddManualAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const val = cleanNumber(manualValuation);
    if (!manualSymbol.trim() || !manualDescription.trim() || val <= 0) return;

    const newItem: PortfolioItem = {
      id: `manual-${Date.now()}`,
      accountNumber: "Direct Ownership",
      accountName: manualAccount,
      symbol: manualSymbol.trim().toUpperCase(),
      description: manualDescription.trim(),
      currentValue: val,
      customCategory: manualCategory,
      isManual: true
    };

    setPortfolioItems(prev => combineDuplicates([...prev, newItem]));
    setShowAddManualModal(false);
    setManualSymbol("");
    setManualDescription("");
    setManualValuation("");
  };

  const handleDeleteItem = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  };

  // Category classification change handler
  const handleItemCategoryChange = (itemId: string, newCategory: string) => {
    setPortfolioItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, customCategory: newCategory };
      }
      return item;
    }));
  };

  // Custom Categories Management
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (trimmed && !customCategories.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
      setNewCatName("");
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === "Other") return; // Keep "Other" as fallback
    
    // Remove category
    setCustomCategories(prev => prev.filter(c => c !== catToDelete));

    // Reclassify affected items to "Other"
    setPortfolioItems(prev => prev.map(item => {
      if (item.customCategory === catToDelete) {
        return { ...item, customCategory: "Other" };
      }
      return item;
    }));
  };

  // Math derivations
  const totalValue = portfolioItems.reduce((sum, item) => sum + item.currentValue, 0);

  // Group portfolio assets by custom category for the Recharts Donut chart
  const donutData = customCategories.map(cat => {
    const value = portfolioItems
      .filter(item => item.customCategory === cat)
      .reduce((sum, item) => sum + item.currentValue, 0);
    return { name: cat, value };
  }).filter(d => d.value > 0);

  // Calculate percentages for data list
  const chartAllocation = donutData.map(d => ({
    ...d,
    percentage: totalValue > 0 ? (d.value / totalValue) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // Filter items to show in the table
  const filteredItems = portfolioItems.filter(item => {
    if (selectedCategoryFilter === "All") return true;
    return item.customCategory === selectedCategoryFilter;
  });

  // Calculate day change metrics from CSV metadata if present
  const totalCostBasis = portfolioItems.reduce((sum, item) => {
    if (item.quantity && item.lastPrice) {
      // Approximate basis from current value vs gain/losses if defined
      const totalGain = item.totalGainLossDollar || 0;
      return sum + (item.currentValue - totalGain);
    }
    return sum + item.currentValue;
  }, 0);

  const totalGainDollar = portfolioItems.reduce((sum, item) => sum + (item.totalGainLossDollar || 0), 0);
  const aggregateGainPercent = totalCostBasis > 0 ? (totalGainDollar / totalCostBasis) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Title Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center p-8 pointer-events-none">
          <Briefcase className="w-64 h-64 text-white" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Coins className="w-3.5 h-3.5" />
              Wealth Optimizer
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">Investment Portfolio</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mt-1 font-medium leading-relaxed">
              Upload files directly from brokerages, manually incorporate alternative assets, and construct custom taxonomies to manage your holistic asset allocation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Import Fidelity CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              accept=".csv"
              className="hidden"
            />
            
            <button
              onClick={() => setShowAddManualModal(true)}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-3 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Manual Asset
            </button>

            {onApplyToNetWorth && (
              <button
                onClick={() => {
                  onApplyToNetWorth(totalValue);
                  setImportFeedback({
                    type: "success",
                    message: `Successfully applied total portfolio valuation of ${symbol}${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to your Net Worth ledger!`
                  });
                  setTimeout(() => setImportFeedback(null), 6000);
                }}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-md cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                Apply To Net Worth
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Portfolio Metadata Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-300">Total Portfolio Value</span>
            <div className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-white">
              {symbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-300">CSV-Imported Assets</span>
            <div className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-emerald-400">
              {portfolioItems.filter(i => !i.isManual).length} positions
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-300">Alternative Valuations</span>
            <div className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-amber-400">
              {portfolioItems.filter(i => i.isManual).length} items
            </div>
          </div>
        </div>
      </div>

      {/* CSV Import Alerts and Feedback messages */}
      {importFeedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
          importFeedback.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : "bg-rose-50 border-rose-100 text-rose-800"
        }`}>
          {importFeedback.type === "success" ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">
              {importFeedback.type === "success" ? "Import Successful" : "Import Error"}
            </h4>
            <p className="text-xs mt-0.5 font-medium leading-relaxed">{importFeedback.message}</p>
          </div>
        </div>
      )}

      {/* Allocation Donut Chart Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Custom Category Allocation</h3>
              <p className="text-[10px] text-slate-400">Diversification map filtered by user classifications</p>
            </div>
          </div>
        </div>

        {donutData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <FolderOpen className="w-12 h-12 stroke-1 text-slate-300 mb-2 animate-pulse" />
            <p className="text-xs font-bold">No asset allocations computed yet.</p>
            <p className="text-[10px] text-slate-400 mt-1">Upload a CSV profile or enter custom asset valuations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Pie/Donut Chart Stage */}
            <div className="md:col-span-5 h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell 
                         key={`cell-${index}`} 
                        fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${symbol}${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered sum indicator */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold">Total Portfolio</span>
                <span className="text-base font-black font-sans text-slate-800 mt-0.5">
                  {symbol}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Data listing with beautiful proportional progress indicators */}
            <div className="md:col-span-7 space-y-3">
              {chartAllocation.map((item, index) => (
                <div key={item.name} className="flex flex-col">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }} 
                      />
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                    <div className="font-mono text-slate-800 text-right">
                      <span>{item.percentage.toFixed(1)}%</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-normal">
                        ({symbol}{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                      </span>
                    </div>
                  </div>
                  {/* Visual Progress bar representation */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Unified Table of Positions */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Table Filters & Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Unified Portfolio Assets</h3>
            <p className="text-[11px] text-slate-400">Categorize imported symbols and physical collectibles valuations in a unified ledger.</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Classified as:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
            >
              <option value="All">All Categories</option>
              {customCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Unified Positions Table Component */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderOpen className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3 animate-bounce" />
            <p className="text-xs font-bold text-slate-700">No matching assets found.</p>
            <p className="text-[11px] text-slate-400 mt-1">Change category filter or import an active portfolio CSV.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[10px] uppercase font-mono text-slate-400 bg-slate-50 font-bold">
                  <th className="py-3 px-5">Ticker</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5 text-center">Custom Allocation Category</th>
                  <th className="py-3 px-5 text-right">Current Valuation</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700 text-xs">
                {filteredItems.map((item) => {
                  const isEditing = editingItemId === item.id;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Ticker / Symbol */}
                      <td className="py-3.5 px-5 font-mono font-bold">
                        <span className={`px-2 py-1 rounded text-[10px] tracking-wide font-black ${
                          item.isManual 
                            ? "bg-amber-50 border border-amber-200 text-amber-800" 
                            : "bg-indigo-50 border border-indigo-100 text-indigo-800"
                        }`}>
                          {item.symbol}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        ) : (
                          <span className="text-slate-600 block truncate max-w-[280px] font-medium" title={item.description}>
                            {item.description}
                          </span>
                        )}
                        {item.isManual && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 rounded mt-1">
                            Manual Entry
                          </span>
                        )}
                      </td>

                      {/* Custom Allocation Category selector */}
                      <td className="py-3.5 px-5 text-center">
                        <select
                          value={item.customCategory}
                          onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
                          className="bg-white border border-slate-200 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold text-slate-600 hover:border-slate-300 cursor-pointer"
                        >
                          {customCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>

                      {/* Valuation */}
                      <td className="py-3.5 px-5 text-right font-sans font-black text-slate-800 text-sm">
                        {isEditing ? (
                          <div className="relative inline-block w-24">
                            <span className="absolute left-2 top-1.5 text-[11px] text-slate-400">{symbol}</span>
                            <input
                              type="number"
                              value={editValuation}
                              onChange={(e) => setEditValuation(e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg pl-5 pr-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-500 outline-none font-sans font-black"
                            />
                          </div>
                        ) : (
                          `${symbol}${item.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        )}
                        {totalValue > 0 && (
                          <span className="block text-[9px] text-slate-400 font-mono font-bold mt-0.5">
                            {((item.currentValue / totalValue) * 100).toFixed(1)}% weight
                          </span>
                        )}
                      </td>

                      {/* Action buttons (Manual items editable, CSV items deletes) */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  const val = parseFloat(editValuation);
                                  if (!isNaN(val) && val >= 0) {
                                    setPortfolioItems(prev => prev.map(p => p.id === item.id ? {
                                      ...p,
                                      currentValue: val,
                                      description: editDescription
                                    } : p));
                                    setEditingItemId(null);
                                  }
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {item.isManual && (
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditValuation(item.currentValue.toString());
                                    setEditDescription(item.description);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                  title="Edit asset valuation"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete position"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Classifications & Fidelity CSV Format Guide - Side-by-Side at Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Custom Category Taxonomy Manager Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Dynamic Classifications</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Add or remove portfolio allocation category tags</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {customCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                  <span className="text-slate-700 truncate">{cat}</span>
                  {cat !== "Other" ? (
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition hover:bg-rose-50 cursor-pointer"
                      title="Delete classification category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">Fallback</span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-1.5 mt-2">
              <input
                type="text"
                placeholder="e.g. Crypto, Bonds, Art..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-none transition"
              />
              <button
                type="submit"
                className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                aria-label="Add category item"
              >
                +
              </button>
            </form>
          </div>
        </div>

        {/* Fidelity CSV Format Guide Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              Fidelity CSV Format Guard
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              EZ Money accepts exported CSV reports directly from your Fidelity online portal.
            </p>
            
            <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-500">Expected Columns:</h4>
              <ul className="text-[10px] text-slate-600 space-y-1 list-disc pl-4 font-medium">
                <li><strong className="text-slate-700">Account Number</strong></li>
                <li><strong className="text-slate-700">Symbol</strong></li>
                <li><strong className="text-slate-700">Quantity</strong> &amp; <strong className="text-slate-700">Last Price</strong></li>
                <li><strong className="text-slate-700">Current Value</strong></li>
              </ul>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-normal mt-3">
              <strong>Smart memory:</strong> If you customize a position's category, re-uploading an updated Fidelity export in the future will automatically apply your previously set category!
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100/50 p-3 rounded-2xl">
              <Coins className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-indigo-900 leading-none">Net Worth Integration</h4>
                <p className="text-[9px] text-indigo-600 mt-1 leading-snug font-medium">
                  Manually tracking net worth? Match your investment asset definitions on the Net Worth page to aggregate accurate historical metrics!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Asset Creation Modal */}
      {showAddManualModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold font-sans">Add Alternative / Manual Valuation</h3>
              </div>
              <button 
                onClick={() => setShowAddManualModal(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Asset Identification Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. REALESTATE-A, GOLD-OZ, COMIC-1"
                  value={manualSymbol}
                  onChange={(e) => setManualSymbol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Residential rental property / Rolex Submariner"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Current Valuation</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-bold">{symbol}</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={manualValuation}
                      onChange={(e) => setManualValuation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Custom Category Tag</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
                  >
                    {customCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Holding Account Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Direct Ownership, Physical Safe"
                  value={manualAccount}
                  onChange={(e) => setManualAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  Confirm Asset Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
