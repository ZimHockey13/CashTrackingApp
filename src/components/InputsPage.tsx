import React, { useState } from "react";
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCcw, Tag } from "lucide-react";
import { IncomeSource, ExpenseNode, ExpenseCategory } from "../types";

interface InputsPageProps {
  income: IncomeSource[];
  expenses: ExpenseNode[];
  onAddIncome: (inc: Omit<IncomeSource, "id">) => void;
  onEditIncome: (id: string, updated: Omit<IncomeSource, "id">) => void;
  onDeleteIncome: (id: string) => void;
  onAddExpense: (exp: Omit<ExpenseNode, "id" | "date">) => void;
  onEditExpense: (id: string, updated: Omit<ExpenseNode, "id" | "date">) => void;
  onDeleteExpense: (id: string) => void;
  currencySymbol: string;
  incomeCategories: string[];
  onAddIncomeCategory: (cat: string) => void;
  onDeleteIncomeCategory: (cat: string) => void;
  expenseCategories: string[];
  onAddExpenseCategory: (cat: string) => void;
  onDeleteExpenseCategory: (cat: string) => void;
}

export default function InputsPage({
  income,
  expenses,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  currencySymbol = "$",
  incomeCategories,
  onAddIncomeCategory,
  onDeleteIncomeCategory,
  expenseCategories,
  onAddExpenseCategory,
  onDeleteExpenseCategory
}: InputsPageProps) {
  // Income Form State
  const [incSource, setIncSource] = useState("");
  const [incAmount, setIncAmount] = useState("");
  const [incType, setIncType] = useState<string>(incomeCategories[0] || "Primary");
  const [incRecurring, setIncRecurring] = useState(true);

  // Expense Form State
  const [expItem, setExpItem] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState<ExpenseCategory>(expenseCategories[0] || "Groceries");
  const [expType, setExpType] = useState<"Fixed" | "Variable">("Variable");
  const [expIsSavings, setExpIsSavings] = useState(false);

  // Inline/Modal Editing State
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingIncomeSource, setEditingIncomeSource] = useState("");
  const [editingIncomeAmount, setEditingIncomeAmount] = useState("");
  const [editingIncomeType, setEditingIncomeType] = useState<string>("Primary");
  const [editingIncomeRecurring, setEditingIncomeRecurring] = useState(true);

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingExpenseItem, setEditingExpenseItem] = useState("");
  const [editingExpenseAmount, setEditingExpenseAmount] = useState("");
  const [editingExpenseCategory, setEditingExpenseCategory] = useState<ExpenseCategory>("Groceries");
  const [editingExpenseType, setEditingExpenseType] = useState<"Fixed" | "Variable">("Variable");
  const [editingExpenseIsSavings, setEditingExpenseIsSavings] = useState(false);

  const [showNewEditCategoryField, setShowNewEditCategoryField] = useState(false);
  const [newEditCategoryName, setNewEditCategoryName] = useState("");

  const [showNewIncomeCategoryField, setShowNewIncomeCategoryField] = useState(false);
  const [newIncomeCategoryName, setNewIncomeCategoryName] = useState("");

  const [showNewEditIncomeCategoryField, setShowNewEditIncomeCategoryField] = useState(false);
  const [newEditIncomeCategoryName, setNewEditIncomeCategoryName] = useState("");

  const startEditIncome = (inc: IncomeSource) => {
    setEditingIncomeId(inc.id);
    setEditingIncomeSource(inc.source);
    setEditingIncomeAmount(inc.amount.toString());
    setEditingIncomeType(inc.type);
    setEditingIncomeRecurring(inc.isRecurring);
  };

  const startEditExpense = (exp: ExpenseNode) => {
    setEditingExpenseId(exp.id);
    setEditingExpenseItem(exp.item);
    setEditingExpenseAmount(exp.amount.toString());
    setEditingExpenseCategory(exp.category);
    setEditingExpenseType(exp.type);
    setEditingExpenseIsSavings(exp.isSavings || false);
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incSource.trim() || !incAmount) return;
    const val = parseFloat(incAmount);
    if (isNaN(val) || val <= 0) return;

    onAddIncome({
      source: incSource,
      amount: val,
      type: incType,
      isRecurring: incRecurring
    });

    setIncSource("");
    setIncAmount("");
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expItem.trim() || !expAmount) return;
    const val = parseFloat(expAmount);
    if (isNaN(val) || val <= 0) return;

    onAddExpense({
      item: expItem,
      category: expCategory,
      amount: val,
      type: expType,
      isSavings: expIsSavings
    });

    setExpItem("");
    setExpAmount("");
    setExpIsSavings(false);
  };

  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Income Inbound Registry Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Add Revenue Stream</h3>
          </div>
          
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div>
              <label htmlFor="inc-source-label" className="text-xs font-bold text-slate-500 block mb-1">Source Name</label>
              <input
                id="inc-source-label"
                type="text"
                placeholder="e.g. Day Job Salary, Dividends"
                value={incSource}
                onChange={(e) => setIncSource(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-700 text-xs outline-none transition font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inc-amount-input" className="text-xs font-bold text-slate-500 block mb-1">Monthly Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-xs">{currencySymbol}</span>
                  <input
                    id="inc-amount-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-700 text-xs outline-none transition font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inc-type-dropdown" className="text-xs font-bold text-slate-500 block mb-1">Classification Target</label>
                <select
                  id="inc-type-dropdown"
                  value={incType}
                  onChange={(e) => setIncType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold font-sans"
                >
                  {incomeCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="flex justify-between items-center mt-1">
                  {incomeCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${incType}" classification?`)) {
                          onDeleteIncomeCategory(incType);
                          const remaining = incomeCategories.filter(c => c !== incType);
                          if (remaining.length > 0) {
                            setIncType(remaining[0]);
                          }
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Remove classification
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewIncomeCategoryField(!showNewIncomeCategoryField)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold transition cursor-pointer ml-auto"
                  >
                    + Add custom category
                  </button>
                </div>

                {showNewIncomeCategoryField && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">New Classification Type</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newIncomeCategoryName}
                        onChange={(e) => setNewIncomeCategoryName(e.target.value)}
                        placeholder="e.g. Consulting, Royalties"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold focus:border-emerald-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newIncomeCategoryName.trim();
                            if (trimmed && !incomeCategories.includes(trimmed)) {
                              onAddIncomeCategory(trimmed);
                              setIncType(trimmed);
                              setNewIncomeCategoryName("");
                              setShowNewIncomeCategoryField(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newIncomeCategoryName.trim();
                          if (trimmed && !incomeCategories.includes(trimmed)) {
                            onAddIncomeCategory(trimmed);
                            setIncType(trimmed);
                            setNewIncomeCategoryName("");
                            setShowNewIncomeCategoryField(false);
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewIncomeCategoryField(false);
                          setNewIncomeCategoryName("");
                        }}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <input
                id="inc-recurring-checkbox"
                type="checkbox"
                checked={incRecurring}
                onChange={(e) => setIncRecurring(e.target.checked)}
                className="w-4 h-4 text-emerald-650 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="inc-recurring-checkbox" className="text-xs font-semibold text-slate-650 cursor-pointer select-none">
                Auto-renews every monthly projection cycle
              </label>
            </div>

            <button
              id="btn-add-income"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              Register Income Source
            </button>
          </form>
        </div>

        {/* Expenses Cost Allocation Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">Add Monthly Expense</h3>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <label htmlFor="exp-source-label" className="text-xs font-bold text-slate-500 block mb-1">Expense Detail Label</label>
              <input
                id="exp-source-label"
                type="text"
                placeholder="e.g. Rent, Electricity, Taxes Withheld, Gym"
                value={expItem}
                onChange={(e) => setExpItem(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-700 text-xs outline-none transition font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="exp-amount-input" className="text-xs font-bold text-slate-500 block mb-1">Committed Outflow</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-xs">{currencySymbol}</span>
                  <input
                    id="exp-amount-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-700 text-xs outline-none transition font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="exp-category-dropdown" className="text-xs font-bold text-slate-500 block mb-1">Designated Category</label>
                <select
                  id="exp-category-dropdown"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold font-sans"
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="flex justify-between items-center mt-1">
                  {expenseCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${expCategory}" category?`)) {
                          onDeleteExpenseCategory(expCategory);
                          const remaining = expenseCategories.filter(c => c !== expCategory);
                          if (remaining.length > 0) {
                            setExpCategory(remaining[0]);
                          }
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Remove category
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryField(!showNewCategoryField)}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold transition cursor-pointer ml-auto"
                  >
                    + Add Custom Category
                  </button>
                </div>
                {showNewCategoryField && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">New Category Name</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Pet Care, Hobbies"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold focus:border-amber-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newCategoryName.trim();
                            if (trimmed && !expenseCategories.includes(trimmed)) {
                              onAddExpenseCategory(trimmed);
                              setExpCategory(trimmed);
                              setNewCategoryName("");
                              setShowNewCategoryField(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newCategoryName.trim();
                          if (trimmed && !expenseCategories.includes(trimmed)) {
                            onAddExpenseCategory(trimmed);
                            setExpCategory(trimmed);
                            setNewCategoryName("");
                            setShowNewCategoryField(false);
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryField(false);
                          setNewCategoryName("");
                        }}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-500 block col-span-2">Expense Category Type</label>
              <button
                type="button"
                onClick={() => setExpType("Fixed")}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1 border ${
                  expType === "Fixed"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Fixed Committed
              </button>
              <button
                type="button"
                onClick={() => setExpType("Variable")}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1 border ${
                  expType === "Variable"
                    ? "bg-orange-50 text-orange-600 border-orange-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Variable Discretionary
              </button>
            </div>

            <div className="flex items-center gap-2.5 py-1 px-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
              <input
                id="exp-is-savings"
                type="checkbox"
                checked={expIsSavings}
                onChange={(e) => setExpIsSavings(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-opacity-25 accent-emerald-600 cursor-pointer"
              />
              <label htmlFor="exp-is-savings" className="text-xs font-semibold text-slate-600 cursor-pointer select-none leading-snug">
                Mark as Savings / Investment <span className="text-[10px] text-slate-400 font-normal block">Bypasses fixed/variable in cash flow</span>
              </label>
            </div>

            <button
              id="btn-add-expense"
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              Register Outflow Expense
            </button>
          </form>
        </div>
      </div>

      {/* Ledger lists (Live logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Income Ledger */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800">Revenue Stream Ledger</h4>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-55 text-slate-500 border border-slate-100">
              {income.length} Sources Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            {income.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
                No active income sources recorded. Insert some streams above.
              </div>
            ) : (
              <table className="w-full min-w-[320px] text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]/relaxed">
                    <th className="py-2.5 text-left">Label</th>
                    <th className="py-2.5 text-left">Classification</th>
                    <th className="py-2.5 text-right">Value</th>
                    <th className="py-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {income.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 font-semibold text-slate-700">
                        <div className="flex flex-col">
                          <span>{inc.source}</span>
                          {inc.isRecurring && (
                            <span className="text-[9px] text-emerald-600 font-bold">Auto-renewing month</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-slate-50 font-semibold text-[10px]">
                          {inc.type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-sans font-bold text-emerald-650">
                        {currencySymbol}
                        {inc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEditIncome(inc)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 cursor-pointer border border-transparent hover:border-blue-100"
                            aria-label={`Edit ${inc.source}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteIncome(inc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition duration-200 cursor-pointer border border-transparent hover:border-rose-100"
                            aria-label={`Delete ${inc.source}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Expenses Ledger */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800">Outgoing Commitment Ledger</h4>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-55 text-slate-500 border border-slate-100">
              {expenses.length} Items Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            {expenses.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
                No monthly expenses logged. Register some costs above.
              </div>
            ) : (
              <table className="w-full min-w-[320px] text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]/relaxed">
                    <th className="py-2.5 text-left">Expense Detail</th>
                    <th className="py-2.5 text-left">Category</th>
                    <th className="py-2.5 text-center">Plan</th>
                    <th className="py-2.5 text-right">Value</th>
                    <th className="py-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 font-semibold text-slate-700">
                        {exp.item}
                      </td>
                      <td className="py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-200 text-amber-700 bg-amber-50 text-[10px] font-bold">
                          <Tag className="w-2.5 h-2.5" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {exp.isSavings ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold">
                            Savings
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold ${
                            exp.type === "Fixed"
                              ? "text-blue-600"
                              : "text-orange-600"
                          }`}>
                            {exp.type}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-sans font-bold text-amber-650">
                        {currencySymbol}
                        {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 cursor-pointer border border-transparent hover:border-blue-100"
                            aria-label={`Edit ${exp.item}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition duration-200 cursor-pointer border border-transparent hover:border-rose-100"
                            aria-label={`Delete ${exp.item}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Income Edit Dialog Modal */}
      {editingIncomeId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition duration-300" id="edit-income-modal">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Modify Income Stream Record
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Income Stream Name</label>
                <input
                  type="text"
                  value={editingIncomeSource}
                  onChange={(e) => setEditingIncomeSource(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-707 text-xs outline-none transition font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Monthly Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-xs">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingIncomeAmount}
                      onChange={(e) => setEditingIncomeAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-707 text-xs outline-none transition font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Source Category</label>
                  <select
                    value={editingIncomeType}
                    onChange={(e) => setEditingIncomeType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-700 text-xs outline-none transition cursor-pointer font-semibold font-sans"
                  >
                    {incomeCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="edit-inc-recurring"
                  checked={editingIncomeRecurring}
                  onChange={(e) => setEditingIncomeRecurring(e.target.checked)}
                  className="w-4 h-4 text-emerald-650 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="edit-inc-recurring" className="text-xs font-semibold text-slate-650 cursor-pointer select-none">
                  Auto-renews every monthly projection cycle
                </label>
              </div>

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingIncomeId(null)}
                  className="px-4 py-2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const val = parseFloat(editingIncomeAmount);
                    if (!editingIncomeSource.trim() || isNaN(val) || val <= 0) return;
                    onEditIncome(editingIncomeId, {
                      source: editingIncomeSource,
                      amount: val,
                      type: editingIncomeType,
                      isRecurring: editingIncomeRecurring
                    });
                    setEditingIncomeId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-500/10 transition cursor-pointer font-sans"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Edit Dialog Modal */}
      {editingExpenseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition duration-300" id="edit-expense-modal">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              Modify Outflow Commitment
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Expense Detail Name</label>
                <input
                  type="text"
                  value={editingExpenseItem}
                  onChange={(e) => setEditingExpenseItem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-707 text-xs outline-none transition font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Expense Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans text-xs">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingExpenseAmount}
                      onChange={(e) => setEditingExpenseAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-707 text-xs outline-none transition font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Allocation Category</label>
                   <select
                    value={editingExpenseCategory}
                    onChange={(e) => setEditingExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-705 text-xs outline-none transition cursor-pointer font-semibold text-xs"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewEditCategoryField(!showNewEditCategoryField)}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-bold transition cursor-pointer"
                    >
                      + Add Custom Category
                    </button>
                  </div>
                  {showNewEditCategoryField && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 absolute left-6 right-6 shadow-md z-10">
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">New Category Name</span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newEditCategoryName}
                          onChange={(e) => setNewEditCategoryName(e.target.value)}
                          placeholder="e.g. Pet Care"
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold focus:border-amber-500"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = newEditCategoryName.trim();
                              if (trimmed && !expenseCategories.includes(trimmed)) {
                                onAddExpenseCategory(trimmed);
                                setEditingExpenseCategory(trimmed);
                                setNewEditCategoryName("");
                                setShowNewEditCategoryField(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newEditCategoryName.trim();
                            if (trimmed && !expenseCategories.includes(trimmed)) {
                              onAddExpenseCategory(trimmed);
                              setEditingExpenseCategory(trimmed);
                              newEditCategoryName && setNewEditCategoryName("");
                              setShowNewEditCategoryField(false);
                            }
                          }}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewEditCategoryField(false);
                            setNewEditCategoryName("");
                          }}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Commitment Level</label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingExpenseType("Fixed")}
                    className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition border ${
                      editingExpenseType === "Fixed"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingExpenseType("Variable")}
                    className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition border ${
                      editingExpenseType === "Variable"
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Variable
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 py-1.5 px-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                <input
                  id="edit-exp-is-savings"
                  type="checkbox"
                  checked={editingExpenseIsSavings}
                  onChange={(e) => setEditingExpenseIsSavings(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-opacity-25 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="edit-exp-is-savings" className="text-xs font-semibold text-slate-600 cursor-pointer select-none leading-snug">
                  Mark as Savings / Investment <span className="text-[10px] text-slate-400 font-normal block">Bypasses fixed/variable in cash flow</span>
                </label>
              </div>

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpenseId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-250 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const val = parseFloat(editingExpenseAmount);
                    if (!editingExpenseItem.trim() || isNaN(val) || val <= 0) return;
                    onEditExpense(editingExpenseId, {
                      item: editingExpenseItem,
                      amount: val,
                      category: editingExpenseCategory,
                      type: editingExpenseType,
                      isSavings: editingExpenseIsSavings
                    });
                    setEditingExpenseId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition cursor-pointer"
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
