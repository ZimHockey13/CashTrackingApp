import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Layers, TrendingUp, ShieldAlert, CheckCircle, Lightbulb } from "lucide-react";
import { IncomeSource, ExpenseNode, NetWorthItem, NetWorthHistory, AIInsight } from "../types";

interface ActionableInsightsProps {
  income: IncomeSource[];
  expenses: ExpenseNode[];
  netWorthItems: NetWorthItem[];
  history: NetWorthHistory[];
  currencySymbol: string;
}

export default function ActionableInsights({
  income,
  expenses,
  netWorthItems,
  history,
  currencySymbol
}: ActionableInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerFetchInsights = async (force: boolean) => {
    setIsLoading(true);
    setError(null);

    // Prepare current budget payload for Gemini
    const totalAssets = netWorthItems.filter(i => i.type === "Asset").reduce((acc, i) => acc + i.value, 0);
    const totalLiabilities = netWorthItems.filter(i => i.type === "Liability").reduce((acc, i) => acc + i.value, 0);

    const budgetData = {
      income,
      expenses,
      netWorth: {
        assets: totalAssets,
        liabilities: totalLiabilities
      },
      history,
      currencySymbol
    };

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetData })
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setInsights(data);
      } else {
        throw new Error("Invalid response format received from AI.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to contact local AI service.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch once on component mount
  useEffect(() => {
    triggerFetchInsights(false);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Savings":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case "Expense Budgeting":
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case "Income Growth":
        return <Sparkles className="w-5 h-5 text-emerald-650" />;
      case "Net Worth Strategy":
        return <Layers className="w-5 h-5 text-indigo-600" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-rose-505" />;
    }
  };

  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case "High":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      case "Medium":
        return "bg-amber-50 text-amber-600 border border-amber-105";
      default:
        return "bg-slate-100 text-slate-500 border border-slate-200";
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 text-slate-800 shadow-sm relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Gemini Financial Advisor</h3>
            <p className="text-xs text-slate-500">Actionable, data-driven strategies for optimizing wealth generation</p>
          </div>
        </div>
        <button
          onClick={() => triggerFetchInsights(true)}
          disabled={isLoading}
          className="flex items-center gap-2 justify-center py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-50 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer shadow-md shadow-purple-600/10"
          id="btn-regen-insights"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Running Analysis..." : "Verify & Refresh AI"}
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-purple-100 border-t-purple-650 animate-spin"></div>
            <Sparkles className="w-5 h-5 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">Gemini is reviewing your cash flow...</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[320px]">
            Synthesizing fixed/variable allocations, debt levels, and goals to build high-yield coaching steps.
          </p>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs">
          <p className="text-rose-600 font-semibold mb-2">Error connecting to Advisor Service</p>
          <p className="text-slate-500 max-w-md mx-auto mb-4">{error}</p>
          <button
            onClick={() => triggerFetchInsights(true)}
            className="text-purple-600 hover:underline font-bold"
          >
            Retry analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={`insight-${index}`}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-4 hover:border-slate-300 hover:bg-slate-50 transition duration-305 relative group overflow-hidden"
              style={{ contentVisibility: "auto" }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-200 group-hover:bg-purple-500 transition duration-300"></div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shrink-0 shadow-xs">
                {getCategoryIcon(insight.category)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold text-purple-600 tracking-wider uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {insight.category}
                  </span>
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${getImpactStyle(insight.impact)}`}>
                    {insight.impact}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                  {insight.title}
                </h4>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
