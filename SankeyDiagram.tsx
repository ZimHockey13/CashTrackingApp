import React, { useState, useEffect } from "react";
import { IncomeSource, ExpenseNode } from "../types";
import {
  Calendar,
  Lock,
  Unlock,
  Trash2,
  Calculator,
  TrendingUp,
  Plus,
  AlertCircle,
  CheckCircle2,
  Archive,
  ChevronRight,
  Info,
  Check,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface SankeyDiagramProps {
  income: IncomeSource[];
  expenses: ExpenseNode[];
  currencySymbol: string;
}

interface Node {
  id: string;
  label: string;
  value: number;
  color: string;
  column: number;
}

interface Link {
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  value: number;
  color: string;
  highlightColor: string;
}

export default function SankeyDiagram({
  income,
  expenses,
  currencySymbol = "$"
}: SankeyDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  // ----------------------------------------------------
  // HISTORICAL BUDGET STATE & SYNCING
  // ----------------------------------------------------
  const [historicalBudgets, setHistoricalBudgets] = useState<Array<{
    id: string;
    month: string; // "YYYY-MM"
    categories: Record<string, number>;
    savings?: Record<string, number>;
    taxes?: Record<string, number>;
    totalIncome: number;
    totalExpenses: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem("pf_historical_budgets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sorted = parsed.sort((a, b) => a.month.localeCompare(b.month));
          return sorted.slice(Math.max(0, sorted.length - 6));
        }
      }
    } catch (e) {
      console.error("Failed to read historical budgets", e);
    }
    
    // Default pre-populated high-quality sample data
    return [
      {
        id: "hist-1",
        month: "2026-04",
        categories: {
          "Housing": 1200,
          "Groceries": 450,
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

  useEffect(() => {
    localStorage.setItem("pf_historical_budgets", JSON.stringify(historicalBudgets));
  }, [historicalBudgets]);

  // Finalization state
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("06");
  const [overwriteConfirm, setOverwriteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const MONTH_OPTIONS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const YEAR_OPTIONS = ["2025", "2026", "2027", "2028"];

  // Default to current date on mount
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear().toString();
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    if (YEAR_OPTIONS.includes(y)) setSelectedYear(y);
    setSelectedMonth(m);
  }, []);

  // ----------------------------------------------------
  // CALCULATED VALUES FOR PROJECTIONS & LEDGER
  // ----------------------------------------------------
  // Helper to define currency symbol fallback
  const symbol = currencySymbol || "$";

  const isSavingOrInvestment = (cat: string): boolean => {
    const catLower = (cat || "").toLowerCase();
    return catLower.includes("saving") || catLower.includes("investment");
  };

  const isSavingExpense = (e: ExpenseNode): boolean => {
    return !!e.isSavings || isSavingOrInvestment(e.category);
  };

  const isTaxCategory = (cat: string): boolean => {
    const catLower = (cat || "").toLowerCase();
    return catLower === "taxes" || catLower === "tax" || catLower.includes("withholding") || catLower.includes("tax withheld");
  };

  const isTaxExpense = (e: ExpenseNode): boolean => {
    return isTaxCategory(e.category) || (e.item || "").toLowerCase().includes("tax withheld");
  };

  // Current values
  const activeIncomes = income.filter((inc) => inc.amount > 0);
  const totalIncome = activeIncomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Filter out any expense input categorized under savings/investment or marked as savings
  const activeSavingsExpensesSum = expenses
    .filter(isSavingExpense)
    .reduce((acc, exp) => acc + exp.amount, 0);

  // Filter out any expense input categorized under taxes or marked as tax withholding
  const activeTaxesSum = expenses
    .filter(isTaxExpense)
    .reduce((acc, exp) => acc + exp.amount, 0);

  const activeRegularExpensesSum = totalExpenses - activeSavingsExpensesSum - activeTaxesSum;
  // Net Month Surplus including all savings and investments!
  const netMonthSurplusActive = totalIncome - activeRegularExpensesSum - activeTaxesSum;

  // Union of all categories (excluding savings & investments and taxes)
  const uniqueCategories = Array.from(
    new Set([
      ...expenses.filter((e) => !isSavingExpense(e) && !isTaxExpense(e)).map((e) => e.category),
      ...historicalBudgets.flatMap((hb) => Object.keys(hb.categories))
    ])
  )
    .filter(Boolean)
    .filter((cat) => !isSavingOrInvestment(cat) && !isTaxCategory(cat))
    .sort();

  const historicalCount = historicalBudgets.length;

  // Calculate average spending per category
  const categoryAverages: Record<string, number> = {};
  uniqueCategories.forEach((cat) => {
    let sum = 0;
    historicalBudgets.forEach((hb) => {
      sum += hb.categories[cat] || 0;
    });
    categoryAverages[cat] = historicalCount > 0 ? sum / historicalCount : 0;
  });

  const totalProjectedExpenses = Object.values(categoryAverages).reduce((a, b) => a + b, 0);

  const averageIncome = historicalCount > 0
    ? historicalBudgets.reduce((sum, hb) => sum + hb.totalIncome, 0) / historicalCount
    : 0;

  const getHistoricalSavingsAmount = (hb: { categories: Record<string, number>; savings?: Record<string, number>; totalExpenses: number }): number => {
    if (hb.savings) {
      return (Object.values(hb.savings) as any[]).reduce((sum: number, val: any) => sum + (val || 0), 0);
    }
    return Object.entries(hb.categories).reduce((acc: number, [cat, val]) => {
      if (isSavingOrInvestment(cat)) {
        return acc + val;
      }
      return acc;
    }, 0);
  };

  const getHistoricalTaxesAmount = (hb: { categories: Record<string, number>; taxes?: Record<string, number>; totalExpenses: number }): number => {
    if (hb.taxes) {
      return (Object.values(hb.taxes) as any[]).reduce((sum: number, val: any) => sum + (val || 0), 0);
    }
    return Object.entries(hb.categories).reduce((acc: number, [cat, val]) => {
      if (isTaxCategory(cat)) {
        return acc + val;
      }
      return acc;
    }, 0);
  };

  // Helper to resolve regular expenses (excluding savings and taxes)
  const getHistoricalRegularExpenses = (hb: { categories: Record<string, number>; totalIncome: number; totalExpenses: number; savings?: Record<string, number>; taxes?: Record<string, number> }) => {
    return hb.totalExpenses - getHistoricalSavingsAmount(hb) - getHistoricalTaxesAmount(hb);
  };

  const getHistoricalTakeHome = (hb: { categories: Record<string, number>; totalIncome: number; totalExpenses: number; taxes?: Record<string, number> }) => {
    return hb.totalIncome - getHistoricalTaxesAmount(hb);
  };

  const getHistoricalSurplus = (hb: { categories: Record<string, number>; totalIncome: number; totalExpenses: number; savings?: Record<string, number>; taxes?: Record<string, number> }) => {
    return getHistoricalTakeHome(hb) - getHistoricalRegularExpenses(hb);
  };

  const averageTaxes = historicalCount > 0
    ? historicalBudgets.reduce((sum, hb) => sum + getHistoricalTaxesAmount(hb), 0) / historicalCount
    : 0;

  const averageTakeHome = averageIncome - averageTaxes;

  const averageExpenses = historicalCount > 0
    ? historicalBudgets.reduce((sum, hb) => sum + getHistoricalRegularExpenses(hb), 0) / historicalCount
    : 0;

  const averageRegularExpenses = averageExpenses;

  // Average surplus is take home income minus total monthly expenses (regular expenses)
  const averageSurplus = averageTakeHome - averageRegularExpenses;

  // Handlers
  const handleFinalizeBudget = (force = false) => {
    const targetMonthStr = `${selectedYear}-${selectedMonth}`;
    const exists = historicalBudgets.some((hb) => hb.month === targetMonthStr);

    if (exists && !force) {
      setOverwriteConfirm(true);
      return;
    }

    // Build category spending map for current month, separating regular and savings/investments
    const categoriesMap: Record<string, number> = {};
    const savingsMap: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.amount > 0) {
        if (isSavingExpense(e)) {
          savingsMap[e.category] = (savingsMap[e.category] || 0) + e.amount;
        } else {
          categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
        }
      }
    });

    const newBudget = {
      id: `hist-${Date.now()}`,
      month: targetMonthStr,
      categories: categoriesMap,
      savings: savingsMap,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses
    };

    setHistoricalBudgets((prev) => {
      const filtered = prev.filter((hb) => hb.month !== targetMonthStr);
      const combined = [...filtered, newBudget].sort((a, b) => a.month.localeCompare(b.month));
      return combined.slice(Math.max(0, combined.length - 6));
    });

    setOverwriteConfirm(false);
    setSuccessMessage(`Successfully locked & finalized budget for ${MONTH_OPTIONS.find((o) => o.value === selectedMonth)?.label} ${selectedYear}!`);
    setTimeout(() => setSuccessMessage(""), 4500);
  };

  const handleDeleteHistorical = (id: string) => {
    setHistoricalBudgets((prev) => prev.filter((hb) => hb.id !== id));
  };

  const formatMonthLabel = (mStr: string) => {
    const [y, m] = mStr.split("-");
    const opt = MONTH_OPTIONS.find((o) => o.value === m);
    return opt ? `${opt.label.substring(0, 3)} ${y}` : mStr;
  };

  // Helper to create safe SVG IDs for dynamic categories (to prevent spaces / ampersands breaking the gradients reference making it black)
  const getSafeId = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  };

  // Helper to resolve category colors dynamically with standard presets and dynamic hashing fallback
  const getCategoryColor = (cat: string): string => {
    const catLower = (cat || "").toLowerCase().trim();

    // 1. Preset definitions for core, static standard blocks
    if (
      catLower === "taxes" ||
      catLower === "tax"
    ) {
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
      catLower.includes("401k") ||
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

    // Compute a clean, deterministic hash value from the string
    let hash = 0;
    for (let i = 0; i < catLower.length; i++) {
      hash = catLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Pick from palette using hash modulo
    const index = Math.abs(hash) % curatedPalette.length;
    return curatedPalette[index];
  };

  // 1. Data Sanitization & Math Scaling (Using values declared above)

  // Empty State - Sophisticated Glassmorphic placeholder
  if (totalIncome === 0 && expenses.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-md mx-auto py-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm">
            📊
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Visualizer Feed Empty</h3>
          <p className="text-xs text-slate-400 font-semibold max-w-sm">
            Please log at least one positive income stream and operations expense item to see the dynamic five-stage Sankey flow in real-time.
          </p>
        </div>
      </div>
    );
  }

    // 2. Budget Math (Using totalExpenses declared above)
  
  // Filter out any expense input categorized under savings/investment or marked as savings
  const regularExpenses = expenses.filter((e) => !isSavingExpense(e));
  const savingsExpenses = expenses.filter((e) => isSavingExpense(e));

  const sumFixedExpenses = regularExpenses
    .filter((e) => e.type === "Fixed")
    .reduce((acc, exp) => acc + exp.amount, 0);
  const sumVariableExpenses = regularExpenses
    .filter((e) => e.type === "Variable")
    .reduce((acc, exp) => acc + exp.amount, 0);
  const totalSavingsExpenses = savingsExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Determine Net Surplus or Deficit
  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const deficitAmt = Math.max(0, totalExpenses - totalIncome);

  const totalFlowVal = Math.max(totalIncome, totalExpenses);

  // Group incomes by classification for Column 1
  const incomeByType: Record<string, number> = {};
  activeIncomes.forEach((inc) => {
    incomeByType[inc.type] = (incomeByType[inc.type] || 0) + inc.amount;
  });

  // Extract all categories of expenses/allocation for Column 4
  const categoryNames = Array.from(new Set(expenses.map((e) => e.category)));
  const allCategories = [...categoryNames];
  if (netSavings > 0 && !allCategories.includes("Other Savings")) {
    allCategories.push("Other Savings");
  }

  // ----------------------------------------------------
  // NODES DECLARATION
  // ----------------------------------------------------
  const nodes: Node[] = [];

  // COLUMN 0: Individual Revenue Streams
  activeIncomes.forEach((inc) => {
    nodes.push({
      id: `col0-${inc.id}`,
      label: inc.source,
      value: inc.amount,
      color: "#00A854", // Vivid Green
      column: 0
    });
  });
  if (deficitAmt > 0) {
    nodes.push({
      id: "col0-deficit",
      label: "Support / Debt Funding",
      value: deficitAmt,
      color: "#EF4444", // Salmon Red
      column: 0
    });
  }

  // COLUMN 1: Category/Classification of Revenue Streams
  Object.keys(incomeByType).forEach((type) => {
    nodes.push({
      id: `col1-type-${type}`,
      label: `${type} stream`,
      value: incomeByType[type],
      color: "#00A854",
      column: 1
    });
  });
  if (deficitAmt > 0) {
    nodes.push({
      id: "col1-category-deficit",
      label: "Overdraft Allocation",
      value: deficitAmt,
      color: "#F87171",
      column: 1
    });
  }

  // COLUMN 2: Total Gross Income Pool
  nodes.push({
    id: "col2-gross-income",
    label: "Gross income pool",
    value: totalFlowVal,
    color: "#00A854",
    column: 2
  });

  // COLUMN 3: Fixed vs Variable Expenses & Savings/Surplus
  const hasFixed = sumFixedExpenses > 0;
  const totalVariableColumn3Val = sumVariableExpenses;
  const hasVariable = totalVariableColumn3Val > 0;
  const hasSavings = (netSavings + totalSavingsExpenses) > 0;

  if (hasFixed) {
    nodes.push({
      id: "col3-fixed",
      label: "Fixed expenses",
      value: sumFixedExpenses,
      color: "#F97316", // Beautiful Soft Orange
      column: 3
    });
  }
  if (hasVariable) {
    nodes.push({
      id: "col3-variable",
      label: "Variable expenses",
      value: totalVariableColumn3Val,
      color: "#0ea5e9", // Electric Sky Blue
      column: 3
    });
  }
  if (hasSavings) {
    nodes.push({
      id: "col3-savings",
      label: "Savings / Surplus",
      value: netSavings + totalSavingsExpenses,
      color: "#10B981", // Beautiful Emerald Green
      column: 3
    });
  }

  // COLUMN 4: Categories of Expenses (Merging/Recombining)
  allCategories.forEach((cat) => {
    const isOtherSavingsCat = cat === "Other Savings";
    const catExpenses = expenses.filter((e) => e.category === cat);
    const catVal =
      catExpenses.reduce((sum, e) => sum + e.amount, 0) +
      (isOtherSavingsCat ? netSavings : 0);

    if (catVal > 0) {
      nodes.push({
        id: `col4-category-${cat}`,
        label: cat,
        value: catVal,
        color: getCategoryColor(cat),
        column: 4
      });
    }
  });

  // ----------------------------------------------------
  // LINKS DECLARATION / DEFINITIONS
  // ----------------------------------------------------
  const links: Link[] = [];

  // 1. Column 0 -> Column 1 (Individual Income streams to Category classifications)
  activeIncomes.forEach((inc) => {
    links.push({
      sourceId: `col0-${inc.id}`,
      targetId: `col1-type-${inc.type}`,
      sourceLabel: inc.source,
      targetLabel: `${inc.type} stream`,
      value: inc.amount,
      color: "url(#flow-income-in)",
      highlightColor: "url(#flow-income-in-active)"
    });
  });
  if (deficitAmt > 0) {
    links.push({
      sourceId: "col0-deficit",
      targetId: "col1-category-deficit",
      sourceLabel: "Support / Debt Funding",
      targetLabel: "Overdraft Allocation",
      value: deficitAmt,
      color: "url(#flow-deficit)",
      highlightColor: "url(#flow-deficit-active)"
    });
  }

  // 2. Column 1 -> Column 2 (Category Classifications to the Total Gross Income node)
  Object.keys(incomeByType).forEach((type) => {
    links.push({
      sourceId: `col1-type-${type}`,
      targetId: "col2-gross-income",
      sourceLabel: `${type} stream`,
      targetLabel: "Gross income",
      value: incomeByType[type],
      color: "url(#flow-income-in)",
      highlightColor: "url(#flow-income-in-active)"
    });
  });
  if (deficitAmt > 0) {
    links.push({
      sourceId: "col1-category-deficit",
      targetId: "col2-gross-income",
      sourceLabel: "Overdraft Allocation",
      targetLabel: "Gross income",
      value: deficitAmt,
      color: "url(#flow-deficit)",
      highlightColor: "url(#flow-deficit-active)"
    });
  }

  // 3. Column 2 -> Column 3 (Gross Income pool splitting to Fixed / Variable splits & Savings/Surplus)
  if (hasFixed) {
    links.push({
      sourceId: "col2-gross-income",
      targetId: "col3-fixed",
      sourceLabel: "Gross income pool",
      targetLabel: "Fixed expenses",
      value: sumFixedExpenses,
      color: "url(#flow-gross-to-fixed)",
      highlightColor: "url(#flow-gross-to-fixed-active)"
    });
  }
  if (hasVariable) {
    links.push({
      sourceId: "col2-gross-income",
      targetId: "col3-variable",
      sourceLabel: "Gross income pool",
      targetLabel: "Variable expenses",
      value: totalVariableColumn3Val,
      color: "url(#flow-gross-to-variable)",
      highlightColor: "url(#flow-gross-to-variable-active)"
    });
  }
  if (hasSavings) {
    links.push({
      sourceId: "col2-gross-income",
      targetId: "col3-savings",
      sourceLabel: "Gross income pool",
      targetLabel: "Savings / Surplus",
      value: netSavings + totalSavingsExpenses,
      color: "url(#flow-gross-to-savings)",
      highlightColor: "url(#flow-gross-to-savings-active)"
    });
  }

  // 4. Column 3 -> Column 4 (Fixed, Variable and Savings diverging and Recombining at Category level)
  allCategories.forEach((cat) => {
    const isOtherSavingsCat = cat === "Other Savings";
    const catExpenses = expenses.filter((e) => e.category === cat);
    
    // Split catExpenses into savings vs regular
    const savingsCatExpenses = catExpenses.filter((e) => isSavingExpense(e));
    const regularCatExpenses = catExpenses.filter((e) => !isSavingExpense(e));

    const fixedAmt = regularCatExpenses
      .filter((e) => e.type === "Fixed")
      .reduce((s, e) => s + e.amount, 0);
      
    const varAmt = regularCatExpenses
      .filter((e) => e.type === "Variable")
      .reduce((s, e) => s + e.amount, 0);

    const targetNodeId = `col4-category-${cat}`;
    const safeCatId = getSafeId(cat);

    if (fixedAmt > 0) {
      links.push({
        sourceId: "col3-fixed",
        targetId: targetNodeId,
        sourceLabel: "Fixed commitments",
        targetLabel: cat,
        value: fixedAmt,
        color: `url(#flow-fixed-${safeCatId})`,
        highlightColor: `url(#flow-fixed-${safeCatId}-active)`
      });
    }

    if (varAmt > 0) {
      links.push({
        sourceId: "col3-variable",
        targetId: targetNodeId,
        sourceLabel: "Variable allocations",
        targetLabel: cat,
        value: varAmt,
        color: `url(#flow-variable-${safeCatId})`,
        highlightColor: `url(#flow-variable-${safeCatId}-active)`
      });
    }

    // Direct savings flows
    let savingsFlowAmt = 0;
    if (isOtherSavingsCat) {
      savingsFlowAmt = netSavings;
    } else {
      savingsFlowAmt = savingsCatExpenses.reduce((s, e) => s + e.amount, 0);
    }

    if (savingsFlowAmt > 0) {
      links.push({
        sourceId: "col3-savings",
        targetId: targetNodeId,
        sourceLabel: "Savings / Surplus",
        targetLabel: cat,
        value: savingsFlowAmt,
        color: `url(#flow-savings-${safeCatId})`,
        highlightColor: `url(#flow-savings-${safeCatId}-active)`
      });
    }
  });

  // ----------------------------------------------------
  // GRID MATHEMATICS & LAYOUT SCALING (5-stage)
  // ----------------------------------------------------
  const width = 1100;
  const height = 650;
  const paddingY = 40;
  const nodeWidth = 24;

  const columns = [
    { x: 60, nodes: nodes.filter((n) => n.column === 0) },
    { x: 280, nodes: nodes.filter((n) => n.column === 1) },
    { x: 500, nodes: nodes.filter((n) => n.column === 2) },
    { x: 720, nodes: nodes.filter((n) => n.column === 3) },
    { x: 940, nodes: nodes.filter((n) => n.column === 4) }
  ];

  const usableHeight = height - paddingY * 2;
  const nodeLayouts: Record<
    string,
    { x: number; y: number; w: number; h: number; center: number }
  > = {};

  // Position nodes inside columns
  [0, 1, 2, 3, 4].forEach((colIdx) => {
    const colNodes = nodes.filter((n) => n.column === colIdx);
    const nodeCount = colNodes.length;
    if (nodeCount === 0) return;

    // Sum values in column
    const sum = colNodes.reduce((s, n) => s + n.value, 0);

    // Compute gaps to fit height beautifully
    const gapSize =
      colIdx === 4 ? (nodeCount > 6 ? 10 : 20) : colIdx === 3 ? 45 : colIdx === 2 ? 40 : 24;
    const totalGapHeight = (nodeCount - 1) * gapSize;
    const availableHeight = usableHeight - totalGapHeight;
    const scale = sum > 0 ? availableHeight / sum : 0;

    // Center layout of columns
    const totalComputedHeight = sum * scale + totalGapHeight;
    let currentY = paddingY + (usableHeight - totalComputedHeight) / 2;

    colNodes.forEach((node) => {
      const nodeH = Math.max(12, node.value * scale);
      nodeLayouts[node.id] = {
        x: columns[colIdx].x,
        y: currentY,
        w: nodeWidth,
        h: nodeH,
        center: currentY + nodeH / 2
      };
      currentY += nodeH + gapSize;
    });
  });

  // Keep track of offsets within each node for proportional link connection layering
  const sourceOffsets: Record<string, number> = {};
  const targetOffsets: Record<string, number> = {};

  const renderedLinks = links.map((link, idx) => {
    const sourceLayout = nodeLayouts[link.sourceId];
    const targetLayout = nodeLayouts[link.targetId];

    if (!sourceLayout || !targetLayout) return null;

    // Resolve node values
    const sourceNodeVal = nodes.find((n) => n.id === link.sourceId)?.value || 1;
    const targetNodeVal = nodes.find((n) => n.id === link.targetId)?.value || 1;

    // Ribbon heights
    const hSource = (link.value / sourceNodeVal) * sourceLayout.h;
    const hTarget = (link.value / targetNodeVal) * targetLayout.h;

    const sOffset = sourceOffsets[link.sourceId] || 0;
    const tOffset = targetOffsets[link.targetId] || 0;

    const x0 = sourceLayout.x + sourceLayout.w;
    const y0 = sourceLayout.y + sOffset + hSource / 2;

    const x1 = targetLayout.x;
    const y1 = targetLayout.y + tOffset + hTarget / 2;

    sourceOffsets[link.sourceId] = sOffset + hSource;
    targetOffsets[link.targetId] = tOffset + hTarget;

    // Cubic Bezier flow curves
    const pathData = `
      M ${x0} ${y0 - hSource / 2}
      C ${(x0 + x1) / 2} ${y0 - hSource / 2}, ${(x0 + x1) / 2} ${y1 - hTarget / 2}, ${x1} ${y1 - hTarget / 2}
      L ${x1} ${y1 + hTarget / 2}
      C ${(x0 + x1) / 2} ${y1 + hTarget / 2}, ${(x0 + x1) / 2} ${y0 + hSource / 2}, ${x0} ${y0 + hSource / 2}
      Z
    `;

    const isHovered = hoveredLink === idx;
    const isNodeMuted =
      hoveredNode !== null &&
      link.sourceId !== hoveredNode &&
      link.targetId !== hoveredNode;

    return {
      pathData,
      idx,
      link,
      isHovered,
      isNodeMuted,
      value: link.value,
      sourceId: link.sourceId,
      targetId: link.targetId,
      sourceLabel: link.sourceLabel,
      targetLabel: link.targetLabel,
      color: link.color,
      highlightColor: link.highlightColor
    };
  });

  return (
    <div className="space-y-6">
      <div className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl p-6 text-slate-700 shadow-sm relative overflow-hidden animate-fade-in select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header / Detailed Description */}
      <div className="flex flex-col items-center justify-center text-center mt-3 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
          Proportional Cash Flow Allocation Stream
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-semibold max-w-lg">
          A five-stage Sankey diagram depicting individual revenue channels mapping to their classifications, pooling into Gross Revenue, splitting by Fixed vs Variable obligations, and recombining dynamically into expense categories.
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[1080px] h-[650px] mx-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            id="sankey-svg"
          >
            <defs>
              {/* Dynamic Categories-Gradient Definitions */}
              {allCategories.map((cat) => {
                const catColor = getCategoryColor(cat);
                const safeCatId = getSafeId(cat);
                return (
                  <React.Fragment key={`grads-${safeCatId}`}>
                    {/* Fixed to Category Gradient */}
                    <linearGradient id={`flow-fixed-${safeCatId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.45" />
                      <stop offset="100%" stopColor={catColor} stopOpacity="0.35" />
                    </linearGradient>
                    <linearGradient id={`flow-fixed-${safeCatId}-active`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor={catColor} stopOpacity="0.75" />
                    </linearGradient>

                    {/* Variable to Category Gradient */}
                    <linearGradient id={`flow-variable-${safeCatId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
                      <stop offset="100%" stopColor={catColor} stopOpacity="0.35" />
                    </linearGradient>
                    <linearGradient id={`flow-variable-${safeCatId}-active`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                      <stop offset="100%" stopColor={catColor} stopOpacity="0.75" />
                    </linearGradient>

                    {/* Savings to Category Gradient */}
                    <linearGradient id={`flow-savings-${safeCatId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor={catColor} stopOpacity="0.35" />
                    </linearGradient>
                    <linearGradient id={`flow-savings-${safeCatId}-active`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor={catColor} stopOpacity="0.75" />
                    </linearGradient>
                  </React.Fragment>
                );
              })}

              {/* Standard Solid Green Income Gradient */}
              <linearGradient id="flow-income-in" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#00A854" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="flow-income-in-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00A854" stopOpacity="0.75" />
              </linearGradient>

              {/* Standard Crimson Deficit Gradient */}
              <linearGradient id="flow-deficit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F87171" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="flow-deficit-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F87171" stopOpacity="0.75" />
              </linearGradient>

              {/* Gross to Fixed Split */}
              <linearGradient id="flow-gross-to-fixed" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="flow-gross-to-fixed-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0.75" />
              </linearGradient>

              {/* Gross to Variable Split */}
              <linearGradient id="flow-gross-to-variable" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="flow-gross-to-variable-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75" />
              </linearGradient>

              {/* Gross to Savings Split */}
              <linearGradient id="flow-gross-to-savings" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="flow-gross-to-savings-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A854" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {/* FLOW GRADIENTS RENDERED LINKS */}
            <g className="links-group">
              {renderedLinks.map((rl) => {
                if (!rl) return null;
                return (
                  <path
                    key={`link-${rl.idx}`}
                    d={rl.pathData}
                    fill={rl.isHovered ? rl.highlightColor : rl.color}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: rl.isNodeMuted ? 0.08 : 1,
                      stroke: rl.isHovered ? "rgba(0,0,0,0.02)" : "none",
                      strokeWidth: rl.isHovered ? 1 : 0
                    }}
                    onMouseEnter={() => setHoveredLink(rl.idx)}
                    onMouseLeave={() => setHoveredLink(null)}
                  />
                );
              })}
            </g>

            {/* NODES GROUP */}
            <g className="nodes-group">
              {nodes.map((node) => {
                const layout = nodeLayouts[node.id];
                if (!layout) return null;

                const isMuted = hoveredNode !== null && hoveredNode !== node.id;
                const isHovered = hoveredNode === node.id;

                return (
                  <g
                    key={`node-${node.id}`}
                    className="transition-all duration-300 cursor-pointer"
                    style={{ opacity: isMuted ? 0.3 : 1 }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Node Bars */}
                    <rect
                      x={layout.x}
                      y={layout.y}
                      width={layout.w}
                      height={layout.h}
                      rx={3}
                      fill={node.color}
                      stroke={isHovered ? "#334155" : "none"}
                      strokeWidth={isHovered ? 1.5 : 0}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </g>

            {/* 5-STAGE LABELS */}
            {/* COLUMN 0 LABELS (Left aligned, text-anchor end) */}
            <g className="column-0-labels">
              {nodes
                .filter((n) => n.column === 0)
                .map((node) => {
                  const layout = nodeLayouts[node.id];
                  if (!layout) return null;
                  const labelX = layout.x - 12;
                  return (
                    <text
                      key={`lbl-${node.id}`}
                      x={labelX}
                      y={layout.center}
                      textAnchor="end"
                      className="font-sans"
                    >
                      <tspan x={labelX} dy="-2" className="font-bold text-xs text-slate-800">
                        {node.label}
                      </tspan>
                      <tspan
                        x={labelX}
                        dy="14"
                        className="font-semibold text-[11px] text-slate-500"
                      >
                        {symbol}
                        {node.value.toLocaleString()}
                      </tspan>
                    </text>
                  );
                })}
            </g>

            {/* COLUMN 1 LABELS (Classification categories, left of block, text-anchor end) */}
            <g className="column-1-labels">
              {nodes
                .filter((n) => n.column === 1)
                .map((node) => {
                  const layout = nodeLayouts[node.id];
                  if (!layout) return null;
                  const labelX = layout.x - 12;
                  return (
                    <text
                      key={`lbl-${node.id}`}
                      x={labelX}
                      y={layout.center}
                      textAnchor="end"
                      className="font-sans"
                    >
                      <tspan x={labelX} dy="-2" className="font-bold text-xs text-slate-700">
                        {node.label}
                      </tspan>
                      <tspan
                        x={labelX}
                        dy="13"
                        className="font-semibold text-[10px] text-slate-500"
                      >
                        {symbol}
                        {node.value.toLocaleString()}
                      </tspan>
                    </text>
                  );
                })}
            </g>

            {/* COLUMN 2 LABELS (Gross Income, in the same clean format as other columns) */}
            <g className="column-2-labels">
              {nodes
                .filter((n) => n.column === 2)
                .map((node) => {
                  const layout = nodeLayouts[node.id];
                  if (!layout) return null;
                  const labelX = layout.x - 12;
                  return (
                    <text
                      key={`lbl-${node.id}`}
                      x={labelX}
                      y={layout.center}
                      textAnchor="end"
                      className="font-sans"
                    >
                      <tspan x={labelX} dy="-2" className="font-bold text-xs text-slate-700">
                        {node.label}
                      </tspan>
                      <tspan
                        x={labelX}
                        dy="13"
                        className="font-extrabold text-[10px] text-emerald-600"
                      >
                        {symbol}
                        {node.value.toLocaleString()}
                      </tspan>
                    </text>
                  );
                })}
            </g>

            {/* COLUMN 3 LABELS (Fixed vs Variable category, left of block, text-anchor end) */}
            <g className="column-3-labels">
              {nodes
                .filter((n) => n.column === 3)
                .map((node) => {
                  const layout = nodeLayouts[node.id];
                  if (!layout) return null;
                  const labelX = layout.x - 12;
                  return (
                    <text
                      key={`lbl-${node.id}`}
                      x={labelX}
                      y={layout.center}
                      textAnchor="end"
                      className="font-sans"
                    >
                      <tspan x={labelX} dy="-2" className="font-bold text-xs text-slate-700">
                        {node.label}
                      </tspan>
                      <tspan
                        x={labelX}
                        dy="13"
                        className="font-semibold text-[10px] text-slate-500"
                      >
                        {symbol}
                        {node.value.toLocaleString()}
                      </tspan>
                    </text>
                  );
                })}
            </g>

            {/* COLUMN 4 LABELS (Recombined Categories, right of block, text-anchor start) */}
            <g className="column-4-labels">
              {nodes
                .filter((n) => n.column === 4)
                .map((node) => {
                  const layout = nodeLayouts[node.id];
                  if (!layout) return null;
                  const labelX = layout.x + layout.w + 12;
                  return (
                    <text
                      key={`lbl-${node.id}`}
                      x={labelX}
                      y={layout.center}
                      textAnchor="start"
                      className="font-sans"
                    >
                      <tspan x={labelX} dy="-1" className="font-bold text-[11px] text-slate-800">
                        {node.label}
                      </tspan>
                      <tspan
                        x={labelX}
                        dy="13"
                        className="font-semibold text-[10px] text-slate-500"
                      >
                        {symbol}
                        {node.value.toLocaleString()}
                      </tspan>
                    </text>
                  );
                })}
            </g>
          </svg>
        </div>
      </div>

      {/* DYNAMIC INTERACTIVE DETAIL CARD OVERLAY */}
      <div className="mt-6 p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row items-stretch justify-between gap-4 text-xs font-semibold shadow-sm">
        {hoveredLink !== null ? (
          <div className="flex-1 flex flex-col justify-center">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block mb-1">
              Active Flow Ribbon
            </span>
            <p className="text-slate-600 leading-normal">
              Flowing{" "}
              <strong className="text-blue-600 font-bold text-sm">
                {symbol}
                {links[hoveredLink].value.toLocaleString()}
              </strong>{" "}
              from <strong className="text-emerald-600">{links[hoveredLink].sourceLabel}</strong>{" "}
              safely into <strong className="text-indigo-600">{links[hoveredLink].targetLabel}</strong>.
            </p>
          </div>
        ) : hoveredNode !== null ? (
          <div className="flex-1 flex flex-col justify-center">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block mb-1">
              Focused Stream Node
            </span>
            <p className="text-slate-600 leading-normal">
              <strong className="text-slate-800 text-sm">
                {nodes.find((n) => n.id === hoveredNode)?.label}
              </strong>
              : holding net cumulative capacity of{" "}
              <strong className="text-emerald-700 font-bold text-sm">
                {symbol}
                {nodes.find((n) => n.id === hoveredNode)?.value.toLocaleString()}
              </strong>
              .
              {nodes.find((n) => n.id === hoveredNode)?.column === 0 &&
                " Represents an isolated revenue generation channel or deficit backing."}
              {nodes.find((n) => n.id === hoveredNode)?.column === 1 &&
                " Grouped classification category of incoming wealth or financing streams."}
              {nodes.find((n) => n.id === hoveredNode)?.id === "col2-gross-income" &&
                " The total aggregated gross monthly financial intake pool."}
              {nodes.find((n) => n.id === hoveredNode)?.id === "col3-fixed" &&
                " Crucial fixed contractual commitments like rent, credit payments or taxes."}
              {nodes.find((n) => n.id === hoveredNode)?.id === "col3-variable" &&
                " Discretionary allocations, living expenses, grocery spend patterns, and residual surplus."}
              {nodes.find((n) => n.id === hoveredNode)?.column === 4 &&
                " Reassembled category showing the aggregated final cash destination."}
            </p>
          </div>
        ) : (
          <div className="flex-1 text-slate-400 italic flex items-center">
            💡 Hover over any beautiful transparent flow ribbon or vertical colored node bar to audit precise values, categories, recombined metrics, and percentage shares.
          </div>
        )}

        <div className="flex flex-row sm:flex-col gap-4 min-w-[160px] justify-between border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 text-slate-600 font-bold">
          <div className="flex flex-col">
            {hoveredLink !== null ? (
              <>
                <span className="text-[9px] text-blue-600 uppercase font-extrabold tracking-wide leading-none">
                  Share Of Baseline %
                </span>
                <span className="text-base font-black mt-1 text-blue-600">
                  {totalFlowVal > 0
                    ? ((links[hoveredLink].value / totalFlowVal) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </>
            ) : hoveredNode !== null ? (
              <>
                <span className="text-[9px] text-emerald-600 uppercase font-extrabold tracking-wide leading-none">
                  Ratio of Total Cash Flow
                </span>
                <span className="text-base font-black mt-1 text-emerald-600">
                  {totalFlowVal > 0
                    ? (
                        ((nodes.find((n) => n.id === hoveredNode)?.value || 0) / totalFlowVal) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] text-teal-600 uppercase font-extrabold tracking-wide leading-none">
                  Net Savings Ratio
                </span>
                <span
                  className={`text-base font-black mt-1 ${
                    totalIncome > 0 && (netSavings + totalSavingsExpenses) / totalIncome >= 0.2
                      ? "text-emerald-600"
                      : "text-amber-500"
                  }`}
                >
                  {totalIncome > 0 ? (((netSavings + totalSavingsExpenses) / totalIncome) * 100).toFixed(1) : "0.0"}%
                </span>
              </>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">
              Balance Surplus
            </span>
            <span className="text-slate-700 text-xs mt-1">
              {totalIncome > 0
                ? totalExpenses > totalIncome
                  ? "Deficit Spending"
                  : "Surplus Safe"
                : "Empty Stream"}
            </span>
          </div>
        </div>
      </div>
    </div>

      {/* Dynamic Classifications & Projections Dashboard Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finalize Current Month's Budget Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Finalize Month's Budget</h3>
                <p className="text-[10px] text-slate-400 font-semibold font-mono">LOCK-IN MONTHLY ENTRIES</p>
              </div>
            </div>

            {/* Quick active checklist summary */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Active Monthly Income ({income.filter(i => i.amount > 0).length}):</span>
                <span className="font-mono font-bold text-slate-800">{symbol}{totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Active Regular Expenses (excl. Savings):</span>
                <span className="font-mono font-bold text-slate-800">{symbol}{activeRegularExpensesSum.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Active Savings & Investments:</span>
                <span className="font-mono font-bold text-slate-800">{symbol}{activeSavingsExpensesSum.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200/60 my-1 pt-1.5 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Net Month Surplus (including Savings):</span>
                <span className={`font-mono ${netMonthSurplusActive >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {netMonthSurplusActive >= 0 ? "+" : ""}
                  {symbol}{netMonthSurplusActive.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal mb-4 font-semibold">
              💡 Ensure all income and expenses for the month are fully input. Finalizing will log this snapshot as a completed historical record to refine your projected averages.
            </p>

            {/* Selection of Year and Month */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Target Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setOverwriteConfirm(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Target Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setOverwriteConfirm(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alerts / Overwrite Warning feedback */}
            {overwriteConfirm && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl mb-4 text-xs font-semibold text-amber-800 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold leading-tight">Data Overwrite Warning</p>
                  <p className="text-[10px] text-amber-700 font-medium mt-1 leading-snug">
                    A ledger entry already exists for {MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label} {selectedYear}. Overwrite historical record with current inputs?
                  </p>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => handleFinalizeBudget(true)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] rounded-lg transition cursor-pointer"
                    >
                      Yes, Overwrite
                    </button>
                    <button
                      onClick={() => setOverwriteConfirm(false)}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-slate-600 hover:bg-slate-50 font-bold text-[9px] rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-2xl mb-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => handleFinalizeBudget(false)}
            disabled={totalIncome === 0 && totalExpenses === 0}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock &amp; Finalize {MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label} Budget
          </button>
        </div>

        {/* Projected Next Month's Budget & Recommendations Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Forecast &amp; Projections</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Projected budget based on historical average spend</p>
              </div>
            </div>

            {historicalCount === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Calculator className="w-8 h-8 stroke-1 text-slate-300 mb-2 animate-pulse" />
                <p className="text-[11px] font-bold text-slate-700">No historical projection data</p>
                <p className="text-[9px] text-slate-400 mt-1 max-w-xs leading-normal font-medium">
                  Finalize at least one monthly budget to compute your historical average category spending.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl">
                    <span className="text-[8px] uppercase tracking-wider text-emerald-600 font-extrabold block">Avg Monthly Income</span>
                    <span className="text-base font-black font-sans text-emerald-700 block mt-0.5">
                      {symbol}{Math.round(averageIncome).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl">
                    <span className="text-[8px] uppercase tracking-wider text-indigo-600 font-extrabold block">Avg Spent (Projected)</span>
                    <span className="text-base font-black font-sans text-indigo-700 block mt-0.5">
                      {symbol}{Math.round(totalProjectedExpenses).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Projected Savings Rate */}
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Projected Savings Rate</span>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug font-semibold">
                      Based on averages, you are on track to save <strong className="text-emerald-600">{averageIncome > 0 ? ((averageSurplus / averageIncome) * 100).toFixed(1) : "0.0"}%</strong> of your income.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-sans text-emerald-600">
                      {symbol}{Math.round(averageSurplus).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block">Surplus/Mo</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal font-medium">
                  <strong>Smart Guideline:</strong> These rolling averages act as the projected expenses for next month. Try to keep your active entries below these averages.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <Archive className="w-3.5 h-3.5 text-indigo-500" />
              <span>{historicalCount} locked {historicalCount === 1 ? 'month' : 'months'}</span>
            </div>
            <button
              onClick={() => {
                if (confirm("Reset historical budget ledger to the initial 2 months of sample data? This will overwrite custom finalized months.")) {
                  localStorage.removeItem("pf_historical_budgets");
                  window.location.reload();
                }
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Reset ledger to baseline sample inputs"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Historical Ledger Matrix Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Historical Monthly Expenses Ledger</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Breakdown of previous locked months and computed averages</p>
            </div>
          </div>
        </div>

        {historicalBudgets.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Calendar className="w-12 h-12 stroke-1 text-slate-300 mb-2 animate-pulse" />
            <p className="text-xs font-bold">No historical records in ledger.</p>
            <p className="text-[10px] text-slate-400 mt-1">Use the panel above to lock your first month's budget snapshot.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-3 py-3 font-semibold text-slate-500">Expense Category</th>
                  {historicalBudgets.map((hb) => {
                    const isDeleting = deletingId === hb.id;
                    return (
                      <th key={hb.id} className="px-3 py-3 text-right min-w-[125px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDeleting ? (
                            <>
                              <span>{formatMonthLabel(hb.month)}</span>
                              <button
                                onClick={() => setDeletingId(hb.id)}
                                className="text-slate-300 hover:text-rose-600 rounded p-0.5 hover:bg-rose-50 transition cursor-pointer"
                                title={`Delete ${formatMonthLabel(hb.month)}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 animate-pulse">
                              <span className="text-[9px] text-rose-700 font-bold uppercase">Sure?</span>
                              <button
                                onClick={() => {
                                  handleDeleteHistorical(hb.id);
                                  setDeletingId(null);
                                }}
                                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1 hover:bg-rose-100 rounded cursor-pointer"
                              >
                                Yes
                              </button>
                              <span className="text-rose-300 text-[9px]">|</span>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold px-1 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 text-right text-indigo-600 font-extrabold bg-indigo-50/50 rounded-t-lg">
                    Monthly Average (Projected Next Month)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {uniqueCategories.map((cat) => {
                  const avg = categoryAverages[cat] || 0;
                  return (
                    <tr key={cat} className="hover:bg-slate-50/40 transition">
                      <td className="px-3 py-2.5 flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: getCategoryColor(cat) }}
                        />
                        <span className="text-slate-800 font-bold">{cat}</span>
                      </td>
                      {historicalBudgets.map((hb) => {
                        const val = hb.categories[cat] || 0;
                        return (
                          <td key={hb.id} className="px-3 py-2.5 text-right font-mono text-slate-600">
                            {val > 0 ? `${symbol}${val.toLocaleString()}` : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-600 bg-indigo-50/20">
                        {avg > 0 ? `${symbol}${Math.round(avg).toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })}

                {/* Income summary row */}
                <tr className="border-t-2 border-slate-200 bg-emerald-50/20">
                  <td className="px-3 py-3 text-emerald-800 font-extrabold flex items-center gap-2">
                    <span className="text-emerald-600">💰</span>
                    <span>Total Monthly Income</span>
                  </td>
                  {historicalBudgets.map((hb) => (
                    <td key={hb.id} className="px-3 py-3 text-right font-mono font-extrabold text-emerald-700">
                      {symbol}{hb.totalIncome.toLocaleString()}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/40">
                    {symbol}{Math.round(averageIncome).toLocaleString()}
                  </td>
                </tr>

                {/* Taxes summary row */}
                <tr className="bg-rose-50/10">
                  <td className="px-3 py-3 text-rose-800 font-extrabold flex items-center gap-2">
                    <span className="text-rose-500">🏛️</span>
                    <span>Taxes & Withholdings</span>
                  </td>
                  {historicalBudgets.map((hb) => (
                    <td key={hb.id} className="px-3 py-3 text-right font-mono font-extrabold text-rose-700">
                      {symbol}{getHistoricalTaxesAmount(hb).toLocaleString()}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-mono font-black text-rose-800 bg-rose-50/20">
                    {symbol}{Math.round(averageTaxes).toLocaleString()}
                  </td>
                </tr>

                {/* Take home income summary row */}
                <tr className="bg-sky-50/20 border-b border-slate-100">
                  <td className="px-3 py-3 text-sky-900 font-extrabold flex items-center gap-2">
                    <span className="text-sky-600">💼</span>
                    <span>Take Home Income (Income - Taxes)</span>
                  </td>
                  {historicalBudgets.map((hb) => (
                    <td key={hb.id} className="px-3 py-3 text-right font-mono font-black text-sky-800">
                      {symbol}{getHistoricalTakeHome(hb).toLocaleString()}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-mono font-black text-sky-900 bg-sky-50/40">
                    {symbol}{Math.round(averageTakeHome).toLocaleString()}
                  </td>
                </tr>

                {/* Expense summary row */}
                <tr className="bg-slate-50/60">
                  <td className="px-3 py-3 text-slate-800 font-extrabold flex items-center gap-2">
                    <span className="text-indigo-500">💸</span>
                    <span>Total Monthly Expenses</span>
                  </td>
                  {historicalBudgets.map((hb) => (
                    <td key={hb.id} className="px-3 py-3 text-right font-mono font-extrabold text-slate-800">
                      {symbol}{getHistoricalRegularExpenses(hb).toLocaleString()}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-mono font-black text-indigo-700 bg-indigo-50/30">
                    {symbol}{Math.round(averageExpenses).toLocaleString()}
                  </td>
                </tr>

                {/* Surplus summary row */}
                <tr className="bg-indigo-50/20 border-t border-indigo-100">
                  <td className="px-3 py-3 text-indigo-900 font-extrabold flex items-center gap-2">
                    <span className="text-indigo-600">🛡️</span>
                    <span>Net Monthly Surplus (incl. Savings)</span>
                  </td>
                  {historicalBudgets.map((hb) => {
                    const diff = getHistoricalSurplus(hb);
                    return (
                      <td
                        key={hb.id}
                        className={`px-3 py-3 text-right font-mono font-extrabold ${
                          diff >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {symbol}{diff.toLocaleString()}
                      </td>
                    );
                  })}
                  <td
                    className={`px-3 py-3 text-right font-mono font-black bg-indigo-50/40 ${
                      averageSurplus >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {averageSurplus >= 0 ? "+" : ""}
                    {symbol}{Math.round(averageSurplus).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
