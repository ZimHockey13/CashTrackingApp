import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Target,
  PiggyBank,
  CheckCircle,
  Plus,
  Compass,
  Zap,
  Tag,
  Edit2,
  Check,
  ChevronRight
} from "lucide-react";
import {
  IncomeSource,
  ExpenseNode,
  NetWorthItem,
  NetWorthHistory,
  FinancialGoal,
  BudgetPreferences
} from "../types";
import ActionableInsights from "./ActionableInsights";

interface DashboardPageProps {
  income: IncomeSource[];
  expenses: ExpenseNode[];
  netWorthItems: NetWorthItem[];
  history: NetWorthHistory[];
  goals: FinancialGoal[];
  preferences: BudgetPreferences;
  onAddGoal: (goal: Omit<FinancialGoal, "id">) => void;
  onUpdateGoalProgress: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
}

export default function DashboardPage({
  income,
  expenses,
  netWorthItems,
  history,
  goals,
  preferences,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal
}: DashboardPageProps) {
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCategory, setGoalCategory] = useState<any>("Emergency Fund");
  const [goalDate, setGoalDate] = useState("2026-12-31");

  // Local state for adjusting progress of goals directly from card
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState("");
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const totalIncome = income.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const surplus = totalIncome - totalExpenses;

  const isSavingExpense = (e: any): boolean => {
    return !!e.isSavings || (e.category || "").toLowerCase().includes("saving") || (e.category || "").toLowerCase().includes("investment");
  };

  const isTaxExpense = (e: any): boolean => {
    const catLower = (e.category || "").toLowerCase();
    const itemLower = (e.item || "").toLowerCase();
    return catLower === "taxes" || catLower === "tax" || catLower.includes("withholding") || catLower.includes("tax withheld") || itemLower.includes("tax withheld");
  };

  const dashboardRegularExpensesSum = expenses
    .filter((e) => !isSavingExpense(e) && !isTaxExpense(e))
    .reduce((acc, exp) => acc + exp.amount, 0);
  
  // Savings rate accounts for all expenses marked for savings/investment plus additional money not spent (surplus)
  const regularExpensesSum = expenses
    .filter((e) => !e.isSavings && !(e.category || "").toLowerCase().includes("saving") && !(e.category || "").toLowerCase().includes("investment"))
    .reduce((acc, exp) => acc + exp.amount, 0);
  const totalSavings = Math.max(0, totalIncome - regularExpensesSum);
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // Historical budgets loader
  const [historicalBudgets] = useState<any[]>(() => {
    const saved = localStorage.getItem("pf_historical_budgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sorted = parsed.sort((a, b) => a.month.localeCompare(b.month));
          return sorted.slice(Math.max(0, sorted.length - 6));
        }
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: "hist-1",
        month: "2026-04",
        categories: {
          "Housing": 1200,
          "Groceries": 380,
          "Transport": 180,
          "Utilities": 220,
          "Healthcare": 80,
          "Leisure & Dining": 310,
          "Shopping": 150,
          "Subscriptions": 40,
          "Savings & Investments": 800,
          "Taxes": 450,
          "Other": 120
        },
        totalIncome: 4200,
        totalExpenses: 4000
      },
      {
        id: "hist-2",
        month: "2026-05",
        categories: {
          "Housing": 1200,
          "Groceries": 410,
          "Transport": 210,
          "Utilities": 240,
          "Healthcare": 90,
          "Leisure & Dining": 340,
          "Shopping": 180,
          "Subscriptions": 40,
          "Savings & Investments": 950,
          "Taxes": 450,
          "Other": 90
        },
        totalIncome: 4500,
        totalExpenses: 4200
      }
    ];
  });

  // Retirement Projection Slider States
  const [freeRateOfReturn, setFreeRateOfReturn] = useState<number>(() => {
    const saved = localStorage.getItem("pf_ret_free_rate");
    return saved ? parseFloat(saved) : 4.0;
  });

  const [expectedInflationRate, setExpectedInflationRate] = useState<number>(() => {
    const saved = localStorage.getItem("pf_ret_inflation_rate");
    return saved ? parseFloat(saved) : 3.0;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("pf_ret_free_rate", freeRateOfReturn.toString());
  }, [freeRateOfReturn]);

  useEffect(() => {
    localStorage.setItem("pf_ret_inflation_rate", expectedInflationRate.toString());
  }, [expectedInflationRate]);

  // Current Net Worth calculation matching Net Worth Page grouping/latest active items logic
  const currentNetWorth = (() => {
    const groupedByKey: Record<string, typeof netWorthItems[0][]> = {};
    netWorthItems.forEach((item) => {
      const key = `${item.type}-${item.label.trim().toLowerCase()}`;
      if (!groupedByKey[key]) {
        groupedByKey[key] = [];
      }
      groupedByKey[key].push(item);
    });

    const activeNewestItems: typeof netWorthItems[0][] = [];
    Object.values(groupedByKey).forEach((itemsList) => {
      const sorted = [...itemsList].sort((a, b) => {
        const dateA = new Date(a.date || "").getTime() || 0;
        const dateB = new Date(b.date || "").getTime() || 0;
        if (dateB !== dateA) return dateB - dateA;
        return b.id.localeCompare(a.id);
      });
      const newest = sorted[0];
      if (newest && newest.value > 0) {
        activeNewestItems.push(newest);
      }
    });

    const totalAssets = activeNewestItems
      .filter((item) => item.type === "Asset")
      .reduce((sum, item) => sum + item.value, 0);

    const totalLiabilities = activeNewestItems
      .filter((item) => item.type === "Liability")
      .reduce((sum, item) => sum + item.value, 0);

    return totalAssets - totalLiabilities;
  })();

  // Load total portfolio value from local storage or fallback to seed total
  const portfolioValue = (() => {
    try {
      const savedItems = localStorage.getItem("pf_portfolio_items");
      if (savedItems) {
        const items = JSON.parse(savedItems);
        if (Array.isArray(items)) {
          return items.reduce((sum: number, item: any) => sum + (parseFloat(item.currentValue) || 0), 0);
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback seed total matching InvestmentPortfolio.tsx exactly
    return 365945.57;
  })();

  // Math variables for retirement - using ONLY pre-calculated values under the cashflow page (historicalBudgets)
  const isSavingOrInvestment = (cat: string): boolean => {
    const catLower = (cat || "").toLowerCase();
    return catLower.includes("saving") || catLower.includes("investment");
  };

  const isTaxCategory = (cat: string): boolean => {
    const catLower = (cat || "").toLowerCase();
    return catLower === "taxes" || catLower === "tax" || catLower.includes("withholding") || catLower.includes("tax withheld");
  };

  const getHistoricalSavingsAmount = (hb: any): number => {
    if (hb.savings) {
      return (Object.values(hb.savings) as any[]).reduce((sum: number, val: any) => sum + (val || 0), 0);
    }
    return Object.entries(hb.categories).reduce((acc: number, [cat, val]) => {
      if (isSavingOrInvestment(cat)) {
        return acc + (val as number);
      }
      return acc;
    }, 0);
  };

  const getHistoricalTaxesAmount = (hb: any): number => {
    if (hb.taxes) {
      return (Object.values(hb.taxes) as any[]).reduce((sum: number, val: any) => sum + (val || 0), 0);
    }
    return Object.entries(hb.categories).reduce((acc: number, [cat, val]) => {
      if (isTaxCategory(cat)) {
        return acc + (val as number);
      }
      return acc;
    }, 0);
  };

  const getHistoricalRegularExpenses = (hb: any) => {
    return hb.totalExpenses - getHistoricalSavingsAmount(hb) - getHistoricalTaxesAmount(hb);
  };

  const historicalCount = historicalBudgets.length;

  const averageIncome = historicalCount > 0
    ? historicalBudgets.reduce((sum, hb) => sum + hb.totalIncome, 0) / historicalCount
    : 0;

  const averageTaxes = historicalCount > 0
    ? historicalBudgets.reduce((sum, hb) => sum + getHistoricalTaxesAmount(hb), 0) / historicalCount
    : 0;

  const averageTakeHome = averageIncome - averageTaxes;

  // Match cashflow page's "Avg Spent (Projected)" or "Total Monthly Expenses" average (excluding savings)
  const averageMonthlyExpenses = historicalCount > 0
    ? historicalBudgets.reduce((sum, hb) => sum + getHistoricalRegularExpenses(hb), 0) / historicalCount
    : 0;

  // Match cashflow page's "Surplus/Mo" (averageSurplus)
  const averageMonthlySavings = averageTakeHome - averageMonthlyExpenses;

  // Needed retirement balance: average monthly expenses / free rate of return (SWR) in today's dollars
  const neededBalanceBase = freeRateOfReturn > 0 
    ? (averageMonthlyExpenses * 12) / (freeRateOfReturn / 100) 
    : 0;

  // Months to reach target purely based on target minus net worth divided by monthly savings
  const monthsToIndependence = averageMonthlySavings > 0 
    ? Math.max(0, neededBalanceBase - currentNetWorth) / averageMonthlySavings 
    : Infinity;

  // Calculate years to independence for adjusting target with inflation
  const yearsToIndependence = monthsToIndependence === Infinity ? 0 : monthsToIndependence / 12;

  // Inflation-adjusted nest egg target: adjusted so we see what that balance realistically needs to be in future dollars
  const neededBalanceInflationAdjusted = neededBalanceBase * Math.pow(1 + (expectedInflationRate / 100), yearsToIndependence);

  const formatMonthsToYearsAndMonths = (totalMonths: number) => {
    if (totalMonths === Infinity) return "Infinite / Needs positive savings";
    if (totalMonths <= 0) return "0 years, 0 months (Achieved! 🎉)";
    if (totalMonths >= 1200) return "100+ Years";
    
    const totalRoundedMonths = Math.round(totalMonths);
    const years = Math.floor(totalRoundedMonths / 12);
    const remainingMonths = totalRoundedMonths % 12;
    
    const yearsStr = `${years} ${years === 1 ? "year" : "years"}`;
    const monthsStr = `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
    
    return `${yearsStr}, ${monthsStr}`;
  };

  const nestEggProgressPercent = neededBalanceInflationAdjusted > 0 
    ? (portfolioValue / neededBalanceInflationAdjusted) * 100 
    : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget) return;

    const targetVal = parseFloat(goalTarget);
    if (isNaN(targetVal) || targetVal <= 0) return;

    onAddGoal({
      name: goalName,
      targetAmount: targetVal,
      currentAmount: 0,
      category: goalCategory,
      dueDate: goalDate
    });

    setGoalName("");
    setGoalTarget("");
  };

  const handleProgressChangeSubmit = (goalId: string) => {
    const val = parseFloat(progressInput);
    if (!isNaN(val)) {
      onUpdateGoalProgress(goalId, val);
    }
    setActiveGoalId(null);
    setProgressInput("");
  };

  // Grouping expenses for simple allocation summaries
  const expenseByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Helper to resolve category colors dynamically with standard presets and dynamic hashing fallback
  const getCategoryColor = (cat: string): string => {
    const catLower = (cat || "").toLowerCase().trim();

    // 1. Preset definitions for core, static standard blocks
    if (catLower === "taxes" || catLower === "tax") {
      return "#D1004B"; // Elegant Crimson/Pink
    }
    if (
      catLower.includes("debt") ||
      catLower.includes("loan") ||
      catLower.includes("interest") ||
      catLower.includes("student")
    ) {
      return "#EF4444"; // Vivid Salmon Red
    }
    if (
      catLower === "housing" ||
      catLower === "utilities" ||
      catLower.includes("mortgage") ||
      catLower.includes("rent") ||
      catLower.includes("home") ||
      catLower.includes("apartment") ||
      catLower.includes("utility") ||
      catLower.includes("bills")
    ) {
      return "#BA8E00"; // Mustard/Gold
    }
    if (
      catLower.includes("savings") ||
      catLower.includes("investment") ||
      catLower.includes("451k") ||
      catLower.includes("ira") ||
      catLower.includes("roth") ||
      catLower.includes("stock") ||
      catLower.includes("portfolio") ||
      catLower.includes("surplus")
    ) {
      return "#00A854"; // Rich Green/Mint
    }

    // 2. Beautiful curated theme color palette to rotate through based on category name hashing
    const curatedPalette = [
      "#0077C0", // Ocean Blue
      "#8B5CF6", // Lavender Purple
      "#EC4899", // Coral Pink
      "#10B981", // Teal Green
      "#F59E0B", // Amber Gold
      "#6366F1", // Indigo Blue
      "#06B6D4", // Sky Cyan
      "#84CC16", // Lime Green
      "#D946EF", // Fuchsia Pink
    ];

    let hash = 0;
    for (let i = 0; i < catLower.length; i++) {
      hash = catLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % curatedPalette.length;
    return curatedPalette[index];
  };

  // Setup data for donut chart
  const donutSlices: { label: string; value: number; color: string; percentage: number; isSurplus?: boolean }[] = [];
  
  if (totalIncome > 0) {
    // 1. Expense categories percentage of total income
    sortedCategories.forEach(([category, value]) => {
      if (value > 0) {
        donutSlices.push({
          label: category,
          value,
          color: getCategoryColor(category),
          percentage: (value / totalIncome) * 100
        });
      }
    });

    // 2. Surplus segment if positive
    if (surplus > 0) {
      donutSlices.push({
        label: "Surplus & Savings",
        value: surplus,
        color: "#00A854", // Rich Green
        percentage: (surplus / totalIncome) * 100,
        isSurplus: true
      });
    }
  } else if (totalExpenses > 0) {
    // If no income is declared, chart relative to total expenses
    sortedCategories.forEach(([category, value]) => {
      if (value > 0) {
        donutSlices.push({
          label: category,
          value,
          color: getCategoryColor(category),
          percentage: (value / totalExpenses) * 100
        });
      }
    });
  }

  // Pre-calculate cumulative offsets so circles chain correctly
  let cumulativePercentBefore = 0;
  const donutSegments = donutSlices.map((slice) => {
    const currentPercentBefore = cumulativePercentBefore;
    cumulativePercentBefore += slice.percentage;
    return {
      ...slice,
      percentBefore: currentPercentBefore,
    };
  });

  const activeDonutSlice = hoveredSlice !== null ? donutSlices.find((s) => s.label === hoveredSlice) : null;

  // Savings progress circle stats
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const targetPercent = preferences.savingsRatioGoalPercentage;
  const currentRatioPercent = Math.min(100, Math.max(0, savingsRate));
  const strokeDashoffset = circumference - (currentRatioPercent / 100) * circumference;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Inflow KPI */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Revenue Inflow</span>
              <p className="text-xl font-bold font-sans text-slate-800 mt-0.5">
                {preferences.currencySymbol}
                {totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expenses KPI */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Expenses</span>
              <p className="text-xl font-bold font-sans text-slate-800 mt-0.5">
                {preferences.currencySymbol}
                {dashboardRegularExpensesSum.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Total Savings KPI */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Savings</span>
              <p className="text-xl font-bold font-sans mt-0.5 text-emerald-600">
                {preferences.currencySymbol}
                {totalSavings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Savings Rate percentage */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Computed Savings Rate</span>
              <p className="text-xl font-bold font-sans text-slate-800 mt-0.5">
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Center Row (savings speed and category allocation list) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Circular Savings Guage */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden" style={{ contentVisibility: "auto" }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-sky-500"></div>
          <div className="w-full text-left">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Savings Rate Velocity</h4>
            <p className="text-[11px] text-slate-500">Your savings rate compared directly to global coaching targets</p>
          </div>

          <div className="relative my-8 flex items-center justify-center">
            <svg width="150" height="150" className="rotate-270">
              {/* Back circle track */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="75"
                cy="75"
                r={radius}
                className="stroke-blue-600"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-sans text-slate-800">{savingsRate.toFixed(0)}%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rate Secured</span>
            </div>
          </div>

          <div className="space-y-1.5 w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div className="flex justify-between font-semibold text-slate-600">
              <span>Your Monthly Ratio:</span>
              <span className="font-bold text-blue-600">{savingsRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-400 text-[11px]">
              <span>Selected Target:</span>
              <span>{targetPercent}%</span>
            </div>
            <div className="border-t border-slate-200/60 pt-2 mt-1.5 text-[10px] text-slate-500">
              {savingsRate >= targetPercent ? (
                <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                  🎉 Level achieved! Exceeding savings target.
                </span>
              ) : (
                <span className="text-rose-500 font-semibold">
                  {preferences.savingsRatioGoalPercentage - (savingsRate || 0) > 0
                    ? `Increase income or trim expenses by ${(preferences.savingsRatioGoalPercentage - savingsRate).toFixed(0)}% to hit goal.`
                    : "Check your settings preferences."}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Allocation breakdown */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between" style={{ contentVisibility: "auto" }}>
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Revenue Allocation & Expenditures</h4>
              <span className="text-[10px] text-slate-400 font-semibold">Interactive dynamic breakdown</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-3">
              {/* Left Column: Premium Donut-Chart visual block */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative bg-slate-50/50 border border-slate-100 p-4 rounded-xl min-h-[220px]">
                {donutSlices.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs italic py-10">
                    No logging inputs to analyze
                  </div>
                ) : (
                  <div className="relative w-[180px] h-[180px] flex items-center justify-center">
                    <svg width="100%" height="100%" viewBox="0 0 200 200">
                      {/* Background base circular layer */}
                      <circle
                        cx="100"
                        cy="100"
                        r="60"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="14"
                      />
                      {/* Colorful circular segment wedges with single parent rotation */}
                      <g transform="rotate(-90 100 100)">
                        {donutSegments.map((seg, idx) => (
                          <circle
                            key={`donut-slice-${idx}`}
                            cx="100"
                            cy="100"
                            r="60"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth={hoveredSlice === seg.label ? "18" : "14"}
                            strokeDasharray={`${(seg.percentage / 100) * 376.991} 376.991`}
                            strokeDashoffset={-((seg.percentBefore / 100) * 376.991)}
                            className="transition-all duration-300 cursor-pointer"
                            style={{
                              opacity: hoveredSlice !== null && hoveredSlice !== seg.label ? 0.4 : 1,
                            }}
                            onMouseEnter={() => setHoveredSlice(seg.label)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        ))}
                      </g>
                    </svg>

                    {/* Absolutely centered text HUD inside the donut hole */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-1">
                      {activeDonutSlice ? (
                        <>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[110px]">
                            {activeDonutSlice.label}
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 font-sans mt-0.5 truncate max-w-[110px]">
                            {preferences.currencySymbol}
                            {Math.round(activeDonutSlice.value).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 mt-0.5">
                            {activeDonutSlice.percentage.toFixed(1)}% {totalIncome > 0 ? "of income" : "of outflow"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            {totalIncome > 0 ? "Total Inflow" : "Total Outflow"}
                          </span>
                          <span className="text-base font-black text-slate-800 font-sans mt-0.5">
                            {preferences.currencySymbol}
                            {(totalIncome > 0 ? totalIncome : totalExpenses).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            {donutSlices.length} segments
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: List of Sorted Categories with dynamic color matching bullets */}
              <div className="md:col-span-7 space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {sortedCategories.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    No monthly expenses recorded yet. Go to Inputs tab to log costs.
                  </div>
                ) : (
                  sortedCategories.map(([category, value]) => {
                    const percentOfIncome = totalIncome > 0 ? (value / totalIncome) * 100 : (value / totalExpenses) * 100;
                    const ratioString = totalIncome > 0 ? `${((value / totalIncome) * 100).toFixed(1)}% of income` : `${((value / totalExpenses) * 100).toFixed(0)}% of expenses`;
                    const catColor = getCategoryColor(category);

                    return (
                      <div key={category} className="space-y-1.5" style={{ contentVisibility: "auto" }}>
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-2 text-slate-600">
                            {/* Color-matched Circular Legend Indicator bullet */}
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 transition-transform duration-300"
                              style={{ 
                                backgroundColor: catColor,
                                transform: hoveredSlice === category ? "scale(1.3)" : "scale(1)"
                              }}
                            />
                            {category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {preferences.currencySymbol}
                              {value.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold font-sans">({ratioString})</span>
                          </div>
                        </div>
                        
                        {/* Styled visual filling bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden cursor-pointer"
                             onMouseEnter={() => setHoveredSlice(category)}
                             onMouseLeave={() => setHoveredSlice(null)}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, percentOfIncome)}%`,
                              backgroundColor: catColor
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 italic mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>💡 Hover over donut wedges or item rows to highlight categories and inspect exact percentage shares.</span>
            <span className="hidden sm:inline text-blue-500 font-semibold">Active Metrics</span>
          </div>
        </div>

      </div>

      {/* Retirement & Financial Independence Projection Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-500">🧭</span> Retirement & Financial Independence Projection
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simulate your target nest egg and projected timeline based on your current financial snapshot and averages
            </p>
          </div>
          <div className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-100/50 self-start md:self-center">
            SWR: {freeRateOfReturn}% | Expected Inflation: {expectedInflationRate}%
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Param Sliders/Inputs */}
          <div className="lg:col-span-4 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-6">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Simulation Parameters</h5>
            
            {/* Safe Withdrawal Rate Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Safe Withdrawal Rate (SWR)</span>
                <span className="font-bold text-emerald-600 font-mono">{freeRateOfReturn.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.1"
                  value={freeRateOfReturn}
                  onChange={(e) => setFreeRateOfReturn(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0.1"
                  max="30"
                  step="0.1"
                  value={freeRateOfReturn}
                  onChange={(e) => setFreeRateOfReturn(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold font-mono text-slate-700 outline-none text-right focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Annual safe percentage of wealth withdrawn for living expenses (default 4.0%).
              </p>
            </div>

            {/* Expected Inflation Rate Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Expected Inflation Rate</span>
                <span className="font-bold text-indigo-600 font-mono">{expectedInflationRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={expectedInflationRate}
                  onChange={(e) => setExpectedInflationRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={expectedInflationRate}
                  onChange={(e) => setExpectedInflationRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold font-mono text-slate-700 outline-none text-right focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                The rate at which the purchasing power of your money decreases annually (default 3.0%).
              </p>
            </div>

            {/* Past months' stats block */}
            <div className="border-t border-slate-200/60 pt-4 space-y-3">
              <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historical Context ({historicalCount} m)</h6>
              
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Avg Monthly Expenses:</span>
                <span className="font-mono font-bold text-slate-700">{preferences.currencySymbol}{Math.round(averageMonthlyExpenses).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Avg Monthly Savings:</span>
                <span className="font-mono font-bold text-emerald-600">{preferences.currencySymbol}{Math.round(averageMonthlySavings).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations & Output Visualizations */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vested Balance Needed Card */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between md:col-span-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Nest Egg Target (Today's Dollars)</span>
                  <p className="text-2xl font-black font-sans text-emerald-700 mt-1">
                    {preferences.currencySymbol}
                    {Math.round(neededBalanceBase).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/50 pt-2.5 text-[10px] text-slate-500">
                  <span className="font-semibold block text-slate-600 mb-0.5">Vested Capital Requirement:</span>
                  <span>(Avg Monthly Expenses × 12) / {freeRateOfReturn}% SWR rate. This baseline maintains your lifestyle without depleting principal.</span>
                </div>
              </div>

              {/* Time to Independence Card */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between md:col-span-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Est. Time to Independence</span>
                  <p className="text-xl font-black font-sans text-indigo-700 mt-1">
                    {formatMonthsToYearsAndMonths(monthsToIndependence)}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/50 pt-2.5 text-[10px] text-slate-500">
                  <span className="font-semibold block text-slate-600 mb-0.5">Linear timeline calculation:</span>
                  <span>Calculated purely as target minus current Net Worth ({preferences.currencySymbol}{Math.round(currentNetWorth).toLocaleString()}) divided by average monthly savings ({preferences.currencySymbol}{Math.round(averageMonthlySavings).toLocaleString()}).</span>
                </div>
              </div>
            </div>

            {/* Inflation Adjusted target showcase card */}
            <div className="bg-gradient-to-br from-indigo-50/40 to-teal-50/20 border border-indigo-100/50 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-indigo-600 tracking-wider block">Future Inflation-Adjusted Target</span>
                  <h5 className="text-2xl font-black font-sans text-indigo-950 mt-1">
                    {preferences.currencySymbol}
                    {Math.round(neededBalanceInflationAdjusted).toLocaleString()}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-2 max-w-xl leading-normal">
                    To maintain the same purchasing power of <strong>{preferences.currencySymbol}{Math.round(neededBalanceBase).toLocaleString()}</strong> in {formatMonthsToYearsAndMonths(monthsToIndependence)} at your <strong>{expectedInflationRate}%</strong> expected inflation rate, your nominal target will be adjusted to this level.
                  </p>
                </div>
                <div className="bg-white/80 border border-indigo-100/80 px-4 py-3 rounded-xl shrink-0 text-right shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Inflation Penalty Factor</span>
                  <span className="text-base font-extrabold text-indigo-600 font-mono mt-0.5 block">
                    +{(((neededBalanceInflationAdjusted / Math.max(1, neededBalanceBase)) - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar with Current vs Needed */}
            <div className="space-y-2 bg-slate-50/30 border border-slate-100 p-4 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Progress Towards Independence</span>
                <span className="font-mono text-emerald-600">
                  {nestEggProgressPercent.toFixed(1)}% of Target
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, nestEggProgressPercent)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                <span>Portfolio Value: {preferences.currencySymbol}{Math.round(portfolioValue).toLocaleString()}</span>
                <span>Target: {preferences.currencySymbol}{Math.round(neededBalanceInflationAdjusted).toLocaleString()}</span>
              </div>
            </div>

            {/* Educational footer callout */}
            <div className="text-[10px] text-slate-400 italic bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
              <span>💡</span>
              <span className="leading-normal">
                <strong>Retirement vs. Accumulation Math</strong>: Your Safe Withdrawal Rate (SWR) of {freeRateOfReturn}% sets the long-term lifestyle target. Inflation of {expectedInflationRate}% dynamically updates your final nominal cash target, helping you stay ahead of purchasing power erosion.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Goal progress cards lists */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm" style={{ contentVisibility: "auto" }}>
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">Monthly Goal Tracking Progress</h4>
            </div>
            <span className="text-[10px] text-slate-400">Set and update priorities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic md:col-span-2">
                No system milestones declared. Add goals using the side form.
              </div>
            ) : (
              goals.map((goal) => {
                const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                const isFinished = percent >= 100;

                return (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition duration-200 relative overflow-hidden ${
                      isFinished
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isFinished && (
                      <div className="absolute top-2 right-2 p-1 bg-emerald-100 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded text-slate-500 uppercase tracking-wide font-bold">
                          {goal.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">by {goal.dueDate}</span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-700 tracking-tight mt-1 truncate">
                        {goal.name}
                      </h5>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-sans">
                        <span className="text-slate-400 font-semibold">Collected:</span>
                        <span className="font-bold text-slate-700">
                          {preferences.currencySymbol}
                          {goal.currentAmount.toLocaleString()} /{" "}
                          <span className="text-slate-400 font-normal">{preferences.currencySymbol}{goal.targetAmount.toLocaleString()}</span>
                        </span>
                      </div>

                      {/* Bar filling details */}
                      <div className="w-full h-1.5 bg-slate-150 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFinished ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center pt-2 text-[10px]">
                        <span className="text-slate-500 font-bold">{percent.toFixed(0)}% Complete</span>
                        
                        {activeGoalId === goal.id ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={progressInput}
                              onChange={(e) => setProgressInput(e.target.value)}
                              className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-800 outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleProgressChangeSubmit(goal.id)}
                              className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer"
                              aria-label="Confirm progress change"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveGoalId(goal.id);
                                setProgressInput("");
                              }}
                              className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Allocate
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => onDeleteGoal(goal.id)}
                              className="text-slate-404 hover:text-rose-500 font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Goal Appender Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm" style={{ contentVisibility: "auto" }}>
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-805">Inject Financial Milestone</h3>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label htmlFor="goal-name-input" className="block text-xs font-bold text-slate-500 mb-1">Milestone Name</label>
              <input
                id="goal-name-input"
                type="text"
                placeholder="e.g. Emergency reserve, travel, PC upgrade"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-700 text-sm outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <label htmlFor="goal-target-input" className="block text-xs font-bold text-slate-500 mb-1">Target Threshold</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-sm">{preferences.currencySymbol}</span>
                  <input
                    id="goal-target-input"
                    type="number"
                    step="50"
                    placeholder="0.00"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-700 text-sm outline-none transition font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal-cat-select" className="block text-xs font-bold text-slate-500 mb-1">Target Segment</label>
                <select
                  id="goal-cat-select"
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-705 text-sm outline-none transition cursor-pointer"
                >
                  <option value="Emergency Fund">Emergency Fund Reserve</option>
                  <option value="Retirement">Retirement Pool Savings</option>
                  <option value="Property">Property & Real-Estate</option>
                  <option value="Investment">Investment Accounts</option>
                  <option value="Vacation">Vacation & Travel Fund</option>
                  <option value="Other">Other Goals</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="goal-due-input" className="block text-xs font-bold text-slate-500 mb-1">Target Deadline</label>
              <input
                id="goal-due-input"
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-650 text-xs outline-none transition cursor-pointer font-semibold"
              />
            </div>

            <button
              id="btn-add-goal"
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Establish Milestone
            </button>
          </form>
        </div>

      </div>

      {/* Actionable Insights Widget (Server-side Gemini proxy) */}
      <ActionableInsights
        income={income}
        expenses={expenses}
        netWorthItems={netWorthItems}
        history={history}
        currencySymbol={preferences.currencySymbol}
      />

    </div>
  );
}
