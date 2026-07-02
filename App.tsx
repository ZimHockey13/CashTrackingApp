import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  TrendingDown,
  TrendingUp,
  Settings as SettingsIcon,
  LayoutDashboard,
  DollarSign,
  Coins,
  ShieldCheck,
  Download,
  Upload
} from "lucide-react";

// Types & Defaults
import {
  IncomeSource,
  ExpenseNode,
  NetWorthItem,
  NetWorthHistory,
  FinancialGoal,
  BudgetPreferences
} from "./types";
import {
  INITIAL_INCOME,
  INITIAL_EXPENSES,
  INITIAL_NET_WORTH,
  INITIAL_HISTORY,
  INITIAL_GOALS,
  DEFAULT_PREFERENCES
} from "./data";

// Subpages
import DashboardPage from "./components/DashboardPage";
import InputsPage from "./components/InputsPage";
import SankeyDiagram from "./components/SankeyDiagram";
import NetWorthPage from "./components/NetWorthPage";
import InvestmentPortfolio from "./components/InvestmentPortfolio";
import SettingsPage from "./components/SettingsPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "inputs" | "cashflow" | "networth" | "portfolio" | "settings">("dashboard");

  // Primary State
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<ExpenseNode[]>([]);
  const [netWorthItems, setNetWorthItems] = useState<NetWorthItem[]>([]);
  const [history, setHistory] = useState<NetWorthHistory[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [preferences, setPreferences] = useState<BudgetPreferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Categories States
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [liabilityCategories, setLiabilityCategories] = useState<string[]>([]);

  const DEFAULT_INCOME_CATEGORIES = ["Primary", "Secondary", "Passive", "Freelance", "Other"];
  const DEFAULT_EXPENSE_CATEGORIES = ["Housing", "Groceries", "Transport", "Utilities", "Healthcare", "Leisure & Dining", "Shopping", "Subscriptions", "Savings & Investments", "Taxes", "Other"];
  const DEFAULT_ASSET_CATEGORIES = ["Cash & Cash Equivalents", "Investment Accounts", "Real Estate", "Vehicles", "Retirement Accounts", "Other Assets"];
  const DEFAULT_LIABILITY_CATEGORIES = ["Credit Card Balances", "Student Loans", "Auto Loans", "Mortgages", "Personal Loans", "Other Liabilities"];

  const handleAddIncomeCategory = (cat: string) => {
    setIncomeCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  };
  const handleDeleteIncomeCategory = (cat: string) => {
    setIncomeCategories(prev => prev.filter(c => c !== cat));
  };

  const handleAddExpenseCategory = (cat: string) => {
    setExpenseCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  };
  const handleDeleteExpenseCategory = (cat: string) => {
    setExpenseCategories(prev => prev.filter(c => c !== cat));
  };

  const handleAddAssetCategory = (cat: string) => {
    setAssetCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  };
  const handleDeleteAssetCategory = (cat: string) => {
    setAssetCategories(prev => prev.filter(c => c !== cat));
  };

  const handleAddLiabilityCategory = (cat: string) => {
    setLiabilityCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  };
  const handleDeleteLiabilityCategory = (cat: string) => {
    setLiabilityCategories(prev => prev.filter(c => c !== cat));
  };

  // Audio helper for UX sound queues
  const playStateSignal = (type: "add" | "delete" | "click") => {
    if (!preferences.enableAlerts) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "add") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === "delete") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
        osc.frequency.exponentialRampToValueAtTime(220.00, audioCtx.currentTime + 0.15); // A3
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {
      // Ignored if browser policy blocks autoplay contexts
    }
  };

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedIncome = localStorage.getItem("pf_income");
      const savedExpenses = localStorage.getItem("pf_expenses");
      const savedNetWorth = localStorage.getItem("pf_networth");
      const savedHistory = localStorage.getItem("pf_history");
      const savedGoals = localStorage.getItem("pf_goals");
      const savedPrefs = localStorage.getItem("pf_preferences");

      const savedIncomeCat = localStorage.getItem("pf_income_categories");
      const savedExpenseCat = localStorage.getItem("pf_expense_categories");
      const savedAssetCat = localStorage.getItem("pf_asset_categories");
      const savedLiabilityCat = localStorage.getItem("pf_liability_categories");

      if (savedIncome) setIncome(JSON.parse(savedIncome));
      else setIncome(INITIAL_INCOME);

      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      else setExpenses(INITIAL_EXPENSES);

      if (savedNetWorth) setNetWorthItems(JSON.parse(savedNetWorth));
      else setNetWorthItems(INITIAL_NET_WORTH);

      if (savedHistory) setHistory(JSON.parse(savedHistory));
      else setHistory(INITIAL_HISTORY);

      if (savedGoals) setGoals(JSON.parse(savedGoals));
      else setGoals(INITIAL_GOALS);

      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
      else setPreferences(DEFAULT_PREFERENCES);

      if (savedIncomeCat) setIncomeCategories(JSON.parse(savedIncomeCat));
      else setIncomeCategories(DEFAULT_INCOME_CATEGORIES);

      if (savedExpenseCat) setExpenseCategories(JSON.parse(savedExpenseCat));
      else setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);

      if (savedAssetCat) setAssetCategories(JSON.parse(savedAssetCat));
      else setAssetCategories(DEFAULT_ASSET_CATEGORIES);

      if (savedLiabilityCat) setLiabilityCategories(JSON.parse(savedLiabilityCat));
      else setLiabilityCategories(DEFAULT_LIABILITY_CATEGORIES);

    } catch (e) {
      console.error("Local storage hydration failed, falling back to defaults", e);
      // Fallback
      setIncome(INITIAL_INCOME);
      setExpenses(INITIAL_EXPENSES);
      setNetWorthItems(INITIAL_NET_WORTH);
      setHistory(INITIAL_HISTORY);
      setGoals(INITIAL_GOALS);
      setPreferences(DEFAULT_PREFERENCES);
      setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      setAssetCategories(DEFAULT_ASSET_CATEGORIES);
      setLiabilityCategories(DEFAULT_LIABILITY_CATEGORIES);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync state back to LocalStorage on modifications
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_income", JSON.stringify(income));
  }, [income, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_expenses", JSON.stringify(expenses));
  }, [expenses, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_networth", JSON.stringify(netWorthItems));
  }, [netWorthItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_history", JSON.stringify(history));
  }, [history, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_goals", JSON.stringify(goals));
  }, [goals, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_preferences", JSON.stringify(preferences));
  }, [preferences, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_income_categories", JSON.stringify(incomeCategories));
  }, [incomeCategories, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_expense_categories", JSON.stringify(expenseCategories));
  }, [expenseCategories, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_asset_categories", JSON.stringify(assetCategories));
  }, [assetCategories, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("pf_liability_categories", JSON.stringify(liabilityCategories));
  }, [liabilityCategories, isHydrated]);

  // Dynamic history derived from netWorthItems based on actual ledger dates
  useEffect(() => {
    if (!isHydrated) return;

    const allDates = netWorthItems
      .map((item) => item.date || "2026-06-20")
      .filter((d) => d && d.trim().length > 0);

    if (allDates.length === 0) {
      setHistory([]);
      return;
    }

    // Sort unique dates chronological ascending
    const sortedDistinctDates = Array.from(new Set(allDates)).sort();

    const computedHistory = sortedDistinctDates.map((d) => {
      const itemsBefore = netWorthItems.filter((item) => {
        const itemDate = item.date || "2026-06-20";
        return itemDate <= d;
      });

      const latestItems: Record<string, NetWorthItem> = {};
      itemsBefore.forEach((item) => {
        const key = `${item.type}-${item.label.toLowerCase().trim()}`;
        if (!latestItems[key] || (item.date || "") > (latestItems[key].date || "")) {
          latestItems[key] = item;
        } else if (item.date === latestItems[key].date && item.id > latestItems[key].id) {
          latestItems[key] = item; // Use newer ID if dates are identical
        }
      });

      let assets = 0;
      let liabilities = 0;
      Object.values(latestItems).forEach((item) => {
        if (item.type === "Asset") {
          assets += item.value;
        } else {
          liabilities += item.value;
        }
      });

      return {
        month: d, // Represents the date string on X axis
        assets,
        liabilities
      };
    });

    setHistory(computedHistory);
  }, [netWorthItems, isHydrated]);

  // State Adjustments Functions
  // 1. Income Management
  const handleAddIncome = (inc: Omit<IncomeSource, "id">) => {
    const newInc: IncomeSource = {
      ...inc,
      id: "inc-" + Date.now()
    };
    setIncome((prev) => [...prev, newInc]);
    playStateSignal("add");
  };

  const handleEditIncome = (id: string, updated: Omit<IncomeSource, "id">) => {
    setIncome((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    playStateSignal("add");
  };

  const handleDeleteIncome = (id: string) => {
    setIncome((prev) => prev.filter((item) => item.id !== id));
    playStateSignal("delete");
  };

  // 2. Expense Management
  const handleAddExpense = (exp: Omit<ExpenseNode, "id" | "date">) => {
    const today = new Date().toISOString().split("T")[0];
    const newExp: ExpenseNode = {
      ...exp,
      id: "exp-" + Date.now(),
      date: today
    };
    setExpenses((prev) => [...prev, newExp]);
    playStateSignal("add");
  };

  const handleEditExpense = (id: string, updated: Omit<ExpenseNode, "id" | "date">) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    playStateSignal("add");
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    playStateSignal("delete");
  };

  // 3. Net Worth Portfolio Management
  const handleAddNetWorthItem = (item: Omit<NetWorthItem, "id">) => {
    const newItem: NetWorthItem = {
      ...item,
      id: "nw-" + Date.now()
    };
    setNetWorthItems((prev) => [...prev, newItem]);
    playStateSignal("add");
  };

  const handleEditNetWorthItem = (id: string, updated: Omit<NetWorthItem, "id">) => {
    setNetWorthItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    playStateSignal("add");
  };

  const handleDeleteNetWorthItem = (id: string) => {
    setNetWorthItems((prev) => prev.filter((item) => item.id !== id));
    playStateSignal("delete");
  };

  const handleApplyPortfolioToNetWorth = (totalValue: number) => {
    const today = new Date().toISOString().split("T")[0];
    
    setNetWorthItems((prev) => {
      // Find an asset with label "portfolio" (case-insensitive) and the exact same date
      const existingIndex = prev.findIndex(
        (item) =>
          item.label.trim().toLowerCase() === "portfolio" &&
          item.date === today &&
          item.type === "Asset"
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          value: totalValue
        };
        return updated;
      } else {
        const newItem: NetWorthItem = {
          id: "nw-" + Date.now(),
          type: "Asset",
          category: "Investment Accounts",
          label: "portfolio",
          value: totalValue,
          date: today
        };
        return [...prev, newItem];
      }
    });

    playStateSignal("add");
  };

  // 4. Milestone Goal Management
  const handleAddGoal = (goal: Omit<FinancialGoal, "id">) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: "goal-" + Date.now()
    };
    setGoals((prev) => [...prev, newGoal]);
    playStateSignal("add");
  };

  const handleUpdateGoalProgress = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            currentAmount: g.currentAmount + amount
          };
        }
        return g;
      })
    );
    playStateSignal("add");
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    playStateSignal("delete");
  };

  // 5. Portability backups (Import / Export JSON Package)
  const handleExportFullState = () => {
    const payload = {
      income,
      expenses,
      netWorthItems,
      history,
      goals,
      preferences,
      version: "1.0.0"
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    playStateSignal("click");
  };

  const handleImportFullState = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (
        Array.isArray(parsed.income) &&
        Array.isArray(parsed.expenses) &&
        Array.isArray(parsed.netWorthItems) &&
        Array.isArray(parsed.history)
      ) {
        setIncome(parsed.income);
        setExpenses(parsed.expenses);
        setNetWorthItems(parsed.netWorthItems);
        setHistory(parsed.history);
        if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
        if (parsed.preferences) setPreferences(parsed.preferences);
        playStateSignal("add");
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // 6. Reset systems
  const handleResetAllData = () => {
    if (confirm("Are you absolutely sure you want to hard wipe the sandbox?")) {
      setIncome([]);
      setExpenses([]);
      setNetWorthItems([]);
      setHistory([]);
      setGoals([]);
      setPreferences(DEFAULT_PREFERENCES);
      playStateSignal("delete");
    }
  };

  const handleLoadSampleData = () => {
    setIncome(INITIAL_INCOME);
    setExpenses(INITIAL_EXPENSES);
    setNetWorthItems(INITIAL_NET_WORTH);
    setHistory(INITIAL_HISTORY);
    setGoals(INITIAL_GOALS);
    setPreferences(DEFAULT_PREFERENCES);
    playStateSignal("add");
  };

  // Safe check before loading layout
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs tracking-wider uppercase font-mono font-semibold">Hydrating ledger environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between select-none">
      
      {/* Decorative Top header bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 py-4 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <DollarSign className="w-5 h-5 text-white font-bold" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 leading-tight tracking-tight">EZ Money</h1>
            <span className="text-[9px] text-slate-500 font-mono font-bold tracking-wider uppercase">SECURED LOCAL WORKSPACE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Static local verification tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[10px] rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Local-First Sandbox
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500 leading-none">
            {new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
          </span>
        </div>
      </header>

      {/* Main Panel Content Box */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 pb-96">
        {activeTab === "dashboard" && (
          <DashboardPage
            income={income}
            expenses={expenses}
            netWorthItems={netWorthItems}
            history={history}
            goals={goals}
            preferences={preferences}
            onAddGoal={handleAddGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === "inputs" && (
          <InputsPage
            income={income}
            expenses={expenses}
            onAddIncome={handleAddIncome}
            onEditIncome={handleEditIncome}
            onDeleteIncome={handleDeleteIncome}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            currencySymbol={preferences.currencySymbol}
            incomeCategories={incomeCategories}
            onAddIncomeCategory={handleAddIncomeCategory}
            onDeleteIncomeCategory={handleDeleteIncomeCategory}
            expenseCategories={expenseCategories}
            onAddExpenseCategory={handleAddExpenseCategory}
            onDeleteExpenseCategory={handleDeleteExpenseCategory}
          />
        )}

        {activeTab === "cashflow" && (
          <SankeyDiagram
            income={income}
            expenses={expenses}
            currencySymbol={preferences.currencySymbol}
          />
        )}

        {activeTab === "networth" && (
          <NetWorthPage
            netWorthItems={netWorthItems}
            history={history}
            onAddItem={handleAddNetWorthItem}
            onEditItem={handleEditNetWorthItem}
            onDeleteItem={handleDeleteNetWorthItem}
            currencySymbol={preferences.currencySymbol}
            assetCategories={assetCategories}
            onAddAssetCategory={handleAddAssetCategory}
            onDeleteAssetCategory={handleDeleteAssetCategory}
            liabilityCategories={liabilityCategories}
            onAddLiabilityCategory={handleAddLiabilityCategory}
            onDeleteLiabilityCategory={handleDeleteLiabilityCategory}
          />
        )}

        {activeTab === "portfolio" && (
          <InvestmentPortfolio
            currencySymbol={preferences.currencySymbol}
            onApplyToNetWorth={handleApplyPortfolioToNetWorth}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPage
            preferences={preferences}
            onUpdatePreferences={setPreferences}
            onResetAllData={handleResetAllData}
            onLoadSampleData={handleLoadSampleData}
            onExportFullState={handleExportFullState}
            onImportFullState={handleImportFullState}
            incomeCategories={incomeCategories}
            onAddIncomeCategory={handleAddIncomeCategory}
            onDeleteIncomeCategory={handleDeleteIncomeCategory}
            expenseCategories={expenseCategories}
            onAddExpenseCategory={handleAddExpenseCategory}
            onDeleteExpenseCategory={handleDeleteExpenseCategory}
            assetCategories={assetCategories}
            onAddAssetCategory={handleAddAssetCategory}
            onDeleteAssetCategory={handleDeleteAssetCategory}
            liabilityCategories={liabilityCategories}
            onAddLiabilityCategory={handleAddLiabilityCategory}
            onDeleteLiabilityCategory={handleDeleteLiabilityCategory}
          />
        )}
        {/* Large Scroll Oasis Buffer */}
        <div className="h-[450px] w-full pointer-events-none" />
      </main>

      {/* Sticky Bottom Navigator */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-md z-45 py-3 px-4">
        <nav className="max-w-lg mx-auto flex items-center justify-between gap-1 sm:gap-2">
          
          <button
            onClick={() => { setActiveTab("dashboard"); playStateSignal("click"); }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition duration-200 cursor-pointer ${
              activeTab === "dashboard"
                ? "text-blue-600 bg-blue-50/60 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Dashboard Tab"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab("inputs"); playStateSignal("click"); }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition duration-200 cursor-pointer ${
              activeTab === "inputs"
                ? "text-blue-600 bg-blue-50/60 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Inputs Tab"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Inputs</span>
          </button>

          <button
            onClick={() => { setActiveTab("cashflow"); playStateSignal("click"); }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition duration-200 cursor-pointer ${
              activeTab === "cashflow"
                ? "text-blue-600 bg-blue-50/60 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Cash Flow Tab"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Cash Flow</span>
          </button>

          <button
            onClick={() => { setActiveTab("networth"); playStateSignal("click"); }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition duration-200 cursor-pointer ${
              activeTab === "networth"
                ? "text-blue-600 bg-blue-50/60 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Net Worth Tab"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Net Worth</span>
          </button>

          <button
            onClick={() => { setActiveTab("portfolio"); playStateSignal("click"); }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition duration-200 cursor-pointer ${
              activeTab === "portfolio"
                ? "text-blue-600 bg-blue-50/60 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Portfolio Tab"
          >
            <Coins className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Portfolio</span>
          </button>

          <button
            onClick={() => { setActiveTab("settings"); playStateSignal("click"); }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition duration-200 cursor-pointer ${
              activeTab === "settings"
                ? "text-blue-600 bg-blue-50/60 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Settings Tab"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
          </button>

        </nav>
      </footer>

    </div>
  );
}
